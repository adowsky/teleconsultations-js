import uuid from 'uuid/v4';
import io from "socket.io-client";

import ParticipantConnection from "./ParticipantConnection";

export default class SignalingServer {
    static LOCAL_STREAM = null;

    constructor(onParticipant, onNewMessage, username) {
        this.pcConfig = {
            'iceServers': [{
                'urls': 'stun:stun.l.google.com:19302'
            }]
        };

        this.socket = io.connect();
        this.username = username;
        this.room = "foo";
        this.creator = false;
        this.nextId = 0;
        this.clients = {};
        this.id = uuid();
        this.onParticipant = onParticipant;
        this.onNewMessage = onNewMessage;
        this.shouldSendUserMedia = false;

        window.onbeforeunload = () => {
            this.sendMessage('bye');
        };

        if (this.room !== '') {
            this.socket.emit("join", { ownerId: this.id, room: this.room });
            console.log("Attempting to join room ", this.room);
        }

        this.configureSocket();
        this.initializeLocalStream();
    }

    configureSocket() {
        this.socket.on('created', (room) => {
            console.log("Created room ", room);
            this.creator = true;
        });

        this.socket.on('full', room => {
            console.log("Room " + room + " is full!");
        });

        this.socket.on('join', peerName => {
            console.log("Peer requested to join ", peerName);
        });

        this.socket.on('joined', room => {
            console.log("Joined room ", room);

        });

        this.socket.on('ready', id => {
            // console.log("ready ", id);
        });

        this.socket.on("message", message => {
            if (message.type === 'got user media') {
                console.log("got media", message);
                const client = new ParticipantConnection(message.ownerId, this.sendMessage.bind(this), this.onParticipant.joined, this.onNewMessage, this.username);

                client.addStream(SignalingServer.LOCAL_STREAM);
                client.call();
                this.clients[message.ownerId] = (client);
            } else if (message.internal && message.internal.type === 'offer') {
                console.log("got offer", message);
                if(message.ownerId === this.id) {
                    return; //todo fix resend to self
                }
                if (!this.clients[message.ownerId]) {
                    const client = new ParticipantConnection(message.ownerId, this.sendMessage.bind(this), this.onParticipant.joined, this.onNewMessage,this.username);
                    client.addStream(SignalingServer.LOCAL_STREAM);
                    this.clients[message.ownerId] = (client);
                }

                const client = this.clients[message.ownerId];
                client.setRemoteDescription(new RTCSessionDescription(message.internal));
                client.doAnswer();
            } else if (message.internal && message.internal.type === 'answer') {
                console.log("got answer", message);
                console.log("answer", message);
                const id = message.ownerId;
                this.clients[id].setRemoteDescription(new RTCSessionDescription(message.internal));
            } else if (message.type === 'candidate') {

                this.clients[message.ownerId].addCandidate(message.label, message.candidate)
            } else if (message.type === "bye") {
                this.clients[message.ownerId].remoteHangup();
                this.onParticipant.disconnect(message.ownerId);
            }
        });
    }

    initializeLocalStream() {
        this.shouldSendUserMedia = true;
        this.sendMessage('got user media');
        if (SignalingServer.LOCAL_STREAM) {
            return;
        }


        navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                width: 250,
                height: 187.5
            }
        }).then(stream => {
            if (SignalingServer.LOCAL_STREAM) {
                return;
            }
            SignalingServer.LOCAL_STREAM = stream;
        })
            .catch(function (e) {
                alert('getUserMedia() error: ' + e.name);
            });
    }


    sendMessage(message, to) {
        if (typeof message !== 'object') {
            message = { type: message };
        }

        if (message instanceof RTCSessionDescription) {
            message = { internal: message };
        }

        if(to) {
            message.to = to;
        }
        message.ownerId = this.id;
        message.timestamp = (new Date).getTime();
        console.debug('Client sending message: ', message);
        this.socket.emit('message', message);
    }



    sendChatMessage = (message) => {
        const keys = Object.keys(this.clients);
        keys.forEach(key => this.clients[key].sendChatMessage(message));
    };

    sendImage = (data, id) => {
        const keys = Object.keys(this.clients);
        keys.forEach(key => this.clients[key].sendImage(data, id));
    };

    sendObject = (data) => {
        const keys = Object.keys(this.clients);
        keys.forEach(key => this.clients[key].sendObject(data));
    };
}