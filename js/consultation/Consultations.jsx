import React from "react";

import Caller from "./Caller";
import Chat from "./Chat";
import SignalingServer from "./SignalingServer";


export default class Consultations extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            callers: [],
            messages: []
        };
        this.serverClient = new SignalingServer(this.onParticipantJoined, this.onNewMessage);

    }

    componentDidMount() {
        console.log("Mounted");
    }

    onParticipantJoined = (participantStream) => {
        const callers = [].concat(this.state.callers);
        callers.push(participantStream);
        console.debug(`Registering new Caller`);

        this.setState({callers});
    };

    onNewMessage = (message, sender) => {
        this.state.messages.push(`[${sender}]: ${message}`);
        this.forceUpdate();
    };

    sendChatMessage = message => {
        this.onNewMessage(message, "You");
        this.serverClient.sendChatMessage(message);
    };

    render() {
        let key = 0;
        return (
            <div>
                { this.state.callers.map(caller => <Caller key={ key++ } stream={ caller } />) }
                <Chat messages={ this.state.messages } send={ this.sendChatMessage } />
            </div>
        );
    }

}