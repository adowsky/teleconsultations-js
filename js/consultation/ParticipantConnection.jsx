export default class ParticipantConnection {
    constructor(id, sendMessage, onAdd) {
        this.id = id;
        this.sendMessage = sendMessage;
        this.stream = null;
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
        } catch (e) {
            console.log('Failed to create PeerConnection, exception: ' + e.message);
            alert('Cannot create RTCPeerConnection object.');
        }

        this.addStream = this.addStream.bind(this);
        this.setLocalAndSendMessage = this.setLocalAndSendMessage.bind(this);
        this.call = this.call.bind(this);
        this.setRemoteDescription = this.setRemoteDescription.bind(this);
        this.addCandidate = this.addCandidate.bind(this);
        this.remoteHangup = this.remoteHangup.bind(this);
    }

    addStream(stream) {
        this.pc.addStream(stream);
    }

     setLocalAndSendMessage (sessionDescription) {
        // Set Opus as the preferred codec in SDP if Opus is present.
        //  sessionDescription.sdp = preferOpus(sessionDescription.sdp);
        //  console.log('setLocalAndSendMessage set desc', sessionDescription);
        this.pc.setLocalDescription(sessionDescription);
        // console.log('setLocalAndSendMessage sending message', sessionDescription);
        this.sendMessage(sessionDescription, this.id);
    };

    call() {
        console.log('Sending offer to peer');
        // this.pc.createOffer(this.setLocalAndSendMessage, event => console.log('createOffer() error: ', event));
        this.pc.createOffer().then(this.setLocalAndSendMessage);
    }

    doAnswer() {
        console.log('Sending answer to peer.');
        this.pc.createAnswer().then(
            this.setLocalAndSendMessage,
            error => console.log('Failed to create session description: ' + error.toString())
        );
    }

    setRemoteDescription(desc) {
        this.pc.setRemoteDescription(new RTCSessionDescription(desc));
    }

    addCandidate(label, candidate) {
        const iceCandidate = new RTCIceCandidate({
            sdpMLineIndex: label,
            candidate: candidate
        });
        this.pc.addIceCandidate(iceCandidate);
        console.log("Candidate added");
    }

    remoteHangup() {
        this.pc.close();
    }
}