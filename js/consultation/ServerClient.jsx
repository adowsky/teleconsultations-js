import io from "socket.io-client";

export default class ServerClient {
    constructor(newConnectionCallback) {
        this.isChannelReady = false;
        this.isInitiator = false;
        this.isStarted = false;
        this.localStream = null;
        this.pc = null;
        this.remoteStream = null;
        this.turnReady = null;
        this.onRemoteConnection = newConnectionCallback;
        this.localVideo = document.querySelector('#localVideo');
        this.remoteVideo = document.querySelector('#remoteVideo');
        this.pcConfig = {
            'iceServers': [{
                'urls': 'stun:stun.l.google.com:19302'
            }]
        };
        this.constraints = {
            video: true
        };
        // Set up audio and video regardless of what devices are present.
        this.sdpConstraints = {
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
        };
        this.room = 'foo';
        this.socket = io.connect();

        if (this.room !== '') {
            this.socket.emit('create or join', this.room);
            console.log('Attempted to create or  join room', this.room);
        }

        this.configureSocet();

        // This client receives a message
        navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true
        })
            .then(stream => this.gotStream(stream))
            .catch(function (e) {
                alert('getUserMedia() error: ' + e.name);
            });

        // if (location.hostname !== 'localhost') {
        //     this.requestTurn(
        //         'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
        //     );
        // }

        window.onbeforeunload = () => {
            this.sendMessage('bye');
        };


        this.createPeerConnection = this.createPeerConnection.bind(this);
        this.doAnswer = this.doAnswer.bind(this);
        this.doCall = this.doCall.bind(this);
        this.extractSdp = this.extractSdp.bind(this);
        this.gotStream = this.gotStream.bind(this);
        this.handleCreateOfferError = this.handleCreateOfferError.bind(this);
        this.handleIceCandidate = this.handleIceCandidate.bind(this);
        this.handleRemoteHangup = this.handleRemoteHangup.bind(this);
        this.handleRemoteStreamAdded = this.handleRemoteStreamAdded.bind(this);
        this.handleRemoteStreamRemoved = this.handleRemoteStreamRemoved.bind(this);
        this.hangup = this.hangup.bind(this);
        this.maybeStart = this.maybeStart.bind(this);
        this.onCreateSessionDescriptionError =  this.onCreateSessionDescriptionError.bind(this);
        this.preferOpus = this.preferOpus.bind(this);
        this.removeCN = this.removeCN.bind(this);
        this.requestTurn =  this.requestTurn.bind(this);
        this.sendMessage =  this.sendMessage.bind(this);
        this.setDefaultCodec = this.setDefaultCodec.bind(this);
        this.setLocalAndSendMessage = this.setLocalAndSendMessage.bind(this);
        this.stop = this.stop.bind(this);
    }

    configureSocet() {
        const socket = this.socket;
        socket.on('created', (room) => {
            console.log('Created room ' + room);
            this.isInitiator = true;
        });

        socket.on('full', (room) => {
            console.log('Room ' + room + ' is full');
        });

        socket.on('join', (room) => {
            console.log('Another peer made a request to join room ' + room);
            console.log('This peer is the initiator of room ' + room + '!');
            this.isChannelReady = true;
        });

        socket.on('joined', (room) => {
            console.log('joined: ' + room);
            this.isChannelReady = true;
        });

        socket.on('log', (array) => {
            console.log.apply(console, array);
        });

        socket.on('message', (message) => {
            console.log('Client received message:', message);
            if (message === 'got user media') {
                this.maybeStart();
            } else if (message.type === 'offer') {
                if (!this.isInitiator && !this.isStarted) {
                    this.maybeStart();
                }
                this.pc.setRemoteDescription(new RTCSessionDescription(message));
                this.doAnswer();
            } else if (message.type === 'answer' && this.isStarted) {
                this.pc.setRemoteDescription(new RTCSessionDescription(message));
            } else if (message.type === 'candidate' && this.isStarted) {
                const candidate = new RTCIceCandidate({
                    sdpMLineIndex: message.label,
                    candidate: message.candidate
                });
                this.pc.addIceCandidate(candidate);
            } else if (message === 'bye' && this.isStarted) {
                this.handleRemoteHangup();
            }
        });
    }


////////////////////////////////////////////////

    sendMessage(message) {
        console.log('Client sending message: ', message);
        this.socket.emit('message', message);
    }

    gotStream(stream) {
        console.log('Adding local stream.');
        // localVideo.src = window.URL.createObjectURL(stream);
        this.localStream = stream;
        this.sendMessage('got user media');
        if (this.isInitiator) {
            this.maybeStart();
        }
    }

    maybeStart() {
        console.log('>>>>>>> maybeStart() ', this.isStarted, this.localStream, this.isChannelReady);
        if (!this.isStarted && typeof this.localStream !== 'undefined' && this.isChannelReady) {
            console.log('>>>>>> creating peer connection');
            this.createPeerConnection();
            this.pc.addStream(this.localStream);
            this.isStarted = true;
            console.log('isInitiator', this.isInitiator);
            if (this.isInitiator) {
                this.doCall();
            }
        }
    }

/////////////////////////////////////////////////////////

    createPeerConnection() {
        try {
            this.pc = new RTCPeerConnection(null);
            const pc = this.pc;
            pc.onicecandidate = this.handleIceCandidate;
            pc.onaddstream = this.handleRemoteStreamAdded;
            pc.onremovestream = this.handleRemoteStreamRemoved;
            console.log('Created RTCPeerConnnection');
        } catch (e) {
            console.log('Failed to create PeerConnection, exception: ' + e.message);
            alert('Cannot create RTCPeerConnection object.');
            return;
        }
    }

    handleIceCandidate(event) {
        console.log('icecandidate event: ', event);
        if (event.candidate) {
            this.sendMessage({
                type: 'candidate',
                label: event.candidate.sdpMLineIndex,
                id: event.candidate.sdpMid,
                candidate: event.candidate.candidate
            });
        } else {
            console.log('End of candidates.');
        }
    }

    handleRemoteStreamAdded(event) {
        console.log('Remote stream added.');
        this.onRemoteConnection(window.URL.createObjectURL(event.stream));
    }

    handleCreateOfferError(event) {
        console.log('createOffer() error: ', event);
    }

    doCall() {
        console.log('Sending offer to peer');
        this.pc.createOffer(this.setLocalAndSendMessage, this.handleCreateOfferError);
    }

    doAnswer() {
        console.log('Sending answer to peer.');
        this.pc.createAnswer().then(
            this.setLocalAndSendMessage,
            this.onCreateSessionDescriptionError
        );
    }

    setLocalAndSendMessage(sessionDescription) {
        // Set Opus as the preferred codec in SDP if Opus is present.
        //  sessionDescription.sdp = preferOpus(sessionDescription.sdp);
        this.pc.setLocalDescription(sessionDescription);
        console.log('setLocalAndSendMessage sending message', sessionDescription);
        this.sendMessage(sessionDescription);
    }

    onCreateSessionDescriptionError(error) {
        //this.trace('Failed to create session description: ' + error.toString());
    }

    requestTurn(turnURL) {
        let turnExists = false;
        for (const i in this.pcConfig.iceServers) {
            if (this.pcConfig.iceServers[i].url.substr(0, 5) === 'turn:') {
                this.turnExists = true;
                this.turnReady = true;
                break;
            }
        }
        if (!turnExists) {
            console.log('Getting TURN server from ', turnURL);
            // No TURN server. Get one from computeengineondemand.appspot.com:
            let xhr = new XMLHttpRequest();
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    let turnServer = JSON.parse(xhr.responseText);
                    console.log('Got TURN server: ', turnServer);
                    this.pcConfig.iceServers.push({
                        'url': 'turn:' + turnServer.username + '@' + turnServer.turn,
                        'credential': turnServer.password
                    });
                    turnReady = true;
                }
            };
            xhr.open('GET', turnURL, true);
            xhr.send();
        }
    }

    handleRemoteStreamAdded(event) {
        console.log('Remote stream added.');
        this.onRemoteConnection(window.URL.createObjectURL(event.stream));
    }

    handleRemoteStreamRemoved(event) {
        console.log('Remote stream removed. Event: ', event);
    }

    hangup() {
        console.log('Hanging up.');
        this.stop();
        this.sendMessage('bye');
    }

    handleRemoteHangup() {
        console.log('Session terminated.');
        this.stop();
        this.isInitiator = false;
    }

    stop() {
        this.isStarted = false;
        // isAudioMuted = false;
        // isVideoMuted = false;
        this.pc.close();
        this.pc = null;
    }

///////////////////////////////////////////

// Set Opus as the default audio codec if it's present.
    preferOpus(sdp) {
        let sdpLines = sdp.split('\r\n');
        let mLineIndex;
        // Search for m line.
        for (let i = 0; i < sdpLines.length; i++) {
            if (sdpLines[i].search('m=audio') !== -1) {
                mLineIndex = i;
                break;
            }
        }
        if (mLineIndex === null) {
            return sdp;
        }

        // If Opus is available, set it as the default in m line.
        for (i = 0; i < sdpLines.length; i++) {
            if (sdpLines[i].search('opus/48000') !== -1) {
                let opusPayload = extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
                if (opusPayload) {
                    sdpLines[mLineIndex] = setDefaultCodec(sdpLines[mLineIndex],
                        opusPayload);
                }
                break;
            }
        }

        // Remove CN in m line and sdp.
        sdpLines = removeCN(sdpLines, mLineIndex);

        sdp = sdpLines.join('\r\n');
        return sdp;
    }

    extractSdp(sdpLine, pattern) {
        let result = sdpLine.match(pattern);
        return result && result.length === 2 ? result[1] : null;
    }

// Set the selected codec to the first in m line.
    setDefaultCodec(mLine, payload) {
        let elements = mLine.split(' ');
        let newLine = [];
        let index = 0;
        for (let i = 0; i < elements.length; i++) {
            if (index === 3) { // Format of media starts from the fourth.
                newLine[index++] = payload; // Put target payload to the first.
            }
            if (elements[i] !== payload) {
                newLine[index++] = elements[i];
            }
        }
        return newLine.join(' ');
    }

// Strip CN from sdp before CN constraints is ready.
    removeCN(sdpLines, mLineIndex) {
        let mLineElements = sdpLines[mLineIndex].split(' ');
        // Scan from end for the convenience of removing an item.
        for (let i = sdpLines.length - 1; i >= 0; i--) {
            let payload = extractSdp(sdpLines[i], /a=rtpmap:(\d+) CN\/\d+/i);
            if (payload) {
                let cnPos = mLineElements.indexOf(payload);
                if (cnPos !== -1) {
                    // Remove CN payload from m line.
                    mLineElements.splice(cnPos, 1);
                }
                // Remove CN line in sdp
                sdpLines.splice(i, 1);
            }
        }

        sdpLines[mLineIndex] = mLineElements.join(' ');
        return sdpLines;
    }
}