import React from "react";

import Caller from "./Caller";
import Chat from "./Chat";
import Photos from "./Photos";
import PhotoUploader from "./PhotoUploader";
import SignalingServer from "./SignalingServer";


export default class Consultations extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            callers: [],
            messages: [],
            photos: []
        };
        this.serverClient = new SignalingServer(this.onParticipantJoined, {
            chat: this.onNewMessage,
            photos: this.onNewPhoto
        });

    }

    componentDidMount() {
        console.log("Mounted");
    }

    onParticipantJoined = (participantStream) => {
        const callers = [].concat(this.state.callers);
        callers.push(participantStream);
        console.debug(`Registering new Caller`);

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

        this.setState({photos});
    };

    sendChatMessage = message => {
        this.onNewMessage(message, "You");
        this.serverClient.sendChatMessage(message);
    };

    sendImage = image => {
      this.onNewPhoto(image, "You");
      this.serverClient.sendImage(image);
    };

    render() {
        let key = 0;
        return (
            <div>
                { this.state.callers.map(caller => <Caller key={ key++ } stream={ caller }/>) }
                <Chat messages={ this.state.messages } send={ this.sendChatMessage }/>
                <Photos photos={ this.state.photos }/>
                <PhotoUploader sendImage={ this.sendImage }/>
            </div>
        );
    }

}