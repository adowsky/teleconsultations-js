import React from "react";

import Caller from "./Caller";
import Chat from "./Chat";
import Photos from "./Photos";
import PhotoUploader from "./PhotoUploader";
import SignalingServer from "./SignalingServer";
import PhotoViewer from "./PhotoViewer";
import uuid from "uuid/v4"


export default class Consultations extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            callers: [],
            messages: [],
            photos: {},
            selectedImageIdx: null
        };
        this.serverClient = new SignalingServer({
            joined: this.onParticipantJoined,
            disconnect: this.onParticipantDisconnect
        }, {
            chat: this.onNewMessage,
            photos: this.onNewPhoto,
            objects: this.onNewObject
        });

    }

    componentDidMount() {
    }

    onParticipantJoined = (participantStream, participantId) => {
        const callers = this.state.callers.concat([{
            stream: participantStream,
            id: participantId
        }]);
        console.debug(`Registering new Caller`);

        this.setState({ callers });
    };

    onParticipantDisconnect = (participantId) => {
        const idx = this.state.callers.map(caller => caller.id).indexOf(participantId);
        const callers = [].concat(this.state.callers);
        callers.splice(idx, 1);
        this.setState({ callers });
    };

    onNewMessage = (message, sender) => {
        this.state.messages.push(`[${sender}]: ${message}`);
        this.forceUpdate();
    };

    onNewPhoto = (photo, id, sender) => {
        const photos = Object.assign({}, this.state.photos, {
            [id]: {
                photo: photo,
                sender: sender,
                comments: []

            }
        });

        this.setState({ photos });

        if(!this.state.selectedImageIdx) {
            this.setState({selectedImageIdx : id});
        }
    };

    onNewObject = (object, sender) => {
        const parsed = JSON.parse(object);
        switch (parsed.type) {
            case "comment":
                const newComments = this.state.photos[parsed.id].comments.concat({
                    comment: parsed.comment,
                    coordinates: parsed.coordinates,
                    sender: sender
                });

                const updatedPhotos = Object.assign({}, this.state.photos);
                updatedPhotos[parsed.id].comments = newComments;

                this.setState({ photos: updatedPhotos });
                console.log("Received new comment ", object);
                break;
        }
    };

    sendChatMessage = message => {
        this.onNewMessage(message, "You");
        this.serverClient.sendChatMessage(message);
    };

    sendImage = image => {
        const id =uuid();
        this.onNewPhoto(image, id );
        this.serverClient.sendImage(image, id);
    };

    onImageSelection = imageIndex => {
        this.setState({selectedImageIdx: imageIndex})
    };

    sendComment = comment => {
        const object = Object.assign({}, comment, {
            type: "comment"
        });


        this.serverClient.sendObject(object);
        this.onNewObject(JSON.stringify(object), "You");
    };

    render() {
        let key = 0;
        return (
            <div>
                <div className="menu-chat-bar">
                    <Chat messages={ this.state.messages } send={ this.sendChatMessage }/>
                    <PhotoUploader sendImage={ this.sendImage }/>
                </div>

                <PhotoViewer
                    image={ this.state.photos[this.state.selectedImageIdx] }
                    publishComment={ this.sendComment }
                    photoId={ this.state.selectedImageIdx }
                />

                <Photos photos={ this.state.photos } selectImage={ this.onImageSelection }  />
                <div className="camera-container">
                    <h3>Participants</h3>
                    { this.state.callers.map(caller => <Caller key={ key++ } stream={ caller }/>) }
                </div>
            </div>
        );
    }

}