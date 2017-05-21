import React from "react";

import Caller from "./Caller";
import Chat from "./Chat";
import Photos from "./Photos";
import PhotoUploader from "./PhotoUploader";
import SignalingServer from "./SignalingServer";
import PhotoViewer from "./PhotoViewer";


export default class Consultations extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            callers: [],
            messages: [],
            photos: [],
            selectedImageIdx: 0
        };
        this.serverClient = new SignalingServer({
            joined: this.onParticipantJoined,
            disconnect: this.onParticipantDisconnect
        }, {
            chat: this.onNewMessage,
            photos: this.onNewPhoto
        });

    }

    componentDidMount() {
        console.log("Mounted");
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

    onNewPhoto = (photo, sender) => {
        const photos = this.state.photos.concat([{
            photo: photo,
            sender: sender
        }]);

        this.setState({ photos });
    };

    sendChatMessage = message => {
        this.onNewMessage(message, "You");
        this.serverClient.sendChatMessage(message);
    };

    sendImage = image => {
        this.onNewPhoto(image, "You");
        this.serverClient.sendImage(image);
    };

    onImageSelection = imageIndex => {
        this.setState({selectedImageIdx: imageIndex})
    };

    render() {
        let key = 0;
        return (
            <div>
                <div className="menu-chat-bar">
                    <Chat messages={ this.state.messages } send={ this.sendChatMessage }/>
                    <PhotoUploader sendImage={ this.sendImage }/>
                </div>
                <PhotoViewer image={ this.state.photos[this.state.selectedImageIdx] } />
                <Photos photos={ this.state.photos } selectImage={ this.onImageSelection }  />
                <div className="camera-container">
                    { this.state.callers.map(caller => <Caller key={ key++ } stream={ caller }/>) }
                </div>
            </div>
        );
    }

}