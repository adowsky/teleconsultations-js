import React from "react";

import Caller from "./Caller";
import ServerClient from "./ServerClient";


export default class Consultations extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            callers: []
        };

        this.onParticipantJoined = this.onParticipantJoined.bind(this);
        this.serverClient = new ServerClient(this.onParticipantJoined);
    }

    componentDidMount() {
        console.log("Mounted");
    }

    onParticipantJoined(participantStream) {
        const callers = [].concat(this.state.callers);
        callers.push(participantStream);
        console.debug(`Registering new Caller`);

        this.setState({callers});
    }

    render() {
        let key = 0;
        return (
            <div>
                { this.state.callers.map(caller => <Caller key={ key++ } stream={ caller } />) }
            </div>
        );
    }

}