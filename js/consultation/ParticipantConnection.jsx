const detectBrowser = () => {
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const isFirefox = /Firefox/.test(navigator.userAgent) && /Mozilla/.test(navigator.appCodeName);
    if (isChrome) return "chrome";
    if (isFirefox) return "firefox";
    return "unknown";
};

export default class ParticipantConnection {
    constructor(id, sendMessage, onAdd, handleNewMessage) {
        this.id = id;
        this.sendMessage = sendMessage;
        this.handleNewMessage = handleNewMessage;
        this.stream = null;
        this.buffer = null;
        this.bufferSize = null;
        this.chat = {
            local: null,
            remote: null
        };

        this.photos = {
            local: null,
            remote: null,
        };

        try {
            this.pc = new RTCPeerConnection(null);
            const handleIceCandidate = event => {
                console.log('icecandidate event: ', event);
                if (event.candidate) {
                    this.sendMessage({
                        type: 'candidate',
                        label: event.candidate.sdpMLineIndex,
                        id: event.candidate.sdpMid,
                        candidate: event.candidate.candidate,
                        to: this.id
                    });
                } else {
                    console.log('End of candidates.');
                }
            };

            const handleStreamAdd = event => {
                console.log('Remote stream added.');
                onAdd(window.URL.createObjectURL(event.stream));
            };

            const handleStreamRemove = event => {
                console.log('Remote stream removed. Event: ', event);
            };

            this.pc.onicecandidate = handleIceCandidate.bind(this);
            this.pc.onaddstream = handleStreamAdd.bind(this);
            this.pc.onremovestream = handleStreamRemove;

            this.chat.local = this.pc.createDataChannel("chat", null);
            this.chat.local.onopen = this.onDataChannelStateChange;
            this.chat.local.onclose = this.onDataChannelStateChange;
            this.pc.ondatachannel = this.receiveDataChannel;

            this.photos.local = this.pc.createDataChannel("photos", null);
            this.photos.local.onopen = this.onDataChannelStateChange;
            this.photos.local.onclose = this.onDataChannelStateChange;
        } catch (e) {
            console.log('Failed to create PeerConnection, exception: ' + e.message);
            alert('Cannot create RTCPeerConnection object.');
        }
    }

    addStream = (stream) => {
        this.pc.addStream(stream);
    };

    setLocalAndSendMessage = (sessionDescription) => {
        // Set Opus as the preferred codec in SDP if Opus is present.
        //  sessionDescription.sdp = preferOpus(sessionDescription.sdp);
        //  console.log('setLocalAndSendMessage set desc', sessionDescription);
        this.pc.setLocalDescription(sessionDescription);
        // console.log('setLocalAndSendMessage sending message', sessionDescription);
        this.sendMessage(sessionDescription, this.id);
    };

    call = () => {
        console.log('Sending offer to peer');
        // this.pc.createOffer(this.setLocalAndSendMessage, event => console.log('createOffer() error: ', event));
        this.pc.createOffer().then(this.setLocalAndSendMessage);
    };

    doAnswer = () => {
        console.log('Sending answer to peer.');
        this.pc.createAnswer().then(
            this.setLocalAndSendMessage,
            error => console.log('Failed to create session description: ' + error.toString())
        );
    };

    setRemoteDescription = (desc) => {
        this.pc.setRemoteDescription(new RTCSessionDescription(desc));
    };

    onDataChannelStateChange = () => {
    };

    receiveDataChannel = event => {
        console.log("Established data channel");
        const type = event.channel.label;
        this[event.channel.label].remote = event.channel;
        this[event.channel.label].remote.onmessage = event => {
            // console.log("Received message:", event.data);
            if (type === "chat") {
                this.handleNewMessage[type](event.data, this.id);
            } else {
                if (detectBrowser() === "chrome") {
                    this.receiveDataChromeFactory(event);
                } else {
                    this.receiveDataFirefoxFactory(event);
                }
            }
        }
    };


    addCandidate = (label, candidate) => {
        const iceCandidate = new RTCIceCandidate({
            sdpMLineIndex: label,
            candidate: candidate
        });
        this.pc.addIceCandidate(iceCandidate);
        console.log("Candidate added");
    };

    remoteHangup = () => {
        this.pc.close();
        this.chat.local.close();
        this.chat.remote.close();
        this.photos.local.close();
        this.photos.remote.close();
    };

    sendChatMessage = (message) => {
        this.chat.local.send(message);
    };

    receiveDataChromeFactory = (event) => {
        if (/(\d+)data:image\/*/.test(event.data)) {
            const regex = /(\d+)(.*)/g;
            const match = regex.exec(event.data);
            const chunks = match[1];
            this.buffer = match[2];
            this.bufferSize = parseInt(chunks);
            console.log("Expecting data of size", this.bufferSize);
            // count = 0;
            // console.log('Expecting a total of ' + buf.byteLength + ' bytes');
            return;
        }
        this.buffer += event.data;

        if (this.bufferSize === this.buffer.length) {
// we're done: all data chunks have been received
            console.log('Done. Rendering photo.');
            this.handleNewMessage.photos(this.buffer, this.id);
        }
    };

    receiveDataFirefoxFactory = (event) => {
        let count, total, parts;

        return (event) => {
            if (typeof event.data === 'string') {
                total = parseInt(event.data);
                parts = [];
                count = 0;
                console.log('Expecting a total of ' + total + ' bytes');
                return;
            }

            parts.push(event.data);
            count += event.data.size;
            console.log('Got ' + event.data.size + ' byte(s), ' + (total - count) +
                ' to go.');

            if (count === total) {
                console.log('Assembling payload');
                const buf = new Uint8ClampedArray(total);
                const compose = (i, pos) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        buf.set(new Uint8ClampedArray(this.result), pos);
                        if (i + 1 === parts.length) {
                            console.log('Done. Rendering photo.');
                            this.handleNewMessage.photos(event.data, this.id);
                        } else {
                            compose(i + 1, pos + this.result.byteLength);
                        }
                    };
                    reader.readAsArrayBuffer(parts[i]);
                };
                compose(0, 0);
            }
        };
    };

    sendImage = (image) => {
        // Split data channel message in chunks of this byte length.
        const CHUNK_LEN = 64000;
        let img = image,
            len = img.length,
            n = len / CHUNK_LEN | 0;

        console.log('Sending a total of ' + len + ' byte(s)');
        // this.photos.local.send(len);
        img = len.toString() + image;
        // split the photo and send in chunks of about 64KB
        for (let i = 0; i < n; i++) {
            const start = i * CHUNK_LEN,
                end = (i + 1) * CHUNK_LEN;
            console.log(start + ' - ' + (end - 1));
            this.photos.local.send(img.substring(start, end));
        }

        // send the reminder, if any
        if (len % CHUNK_LEN) {
            console.log('last ' + len % CHUNK_LEN + ' byte(s)');
            this.photos.local.send(img.substring(n * CHUNK_LEN));
        }
    }
}