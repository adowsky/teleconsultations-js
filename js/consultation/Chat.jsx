import React from "react";

export default class Chat extends React.Component {
    constructor(...props) {
        super(...props);

        this.ref = {
            message: null
        };
    }

    send = event => {
        event.preventDefault();
        this.props.send(this.ref.message.value);
        this.ref.message.value = "";
    };

    render() {
        const messages = this.props.messages || [];
        return (
            <div className="chat">
                <h3>Chat</h3>
                <div className="message-box">
                    { messages.map((message, idx) =>
                        <div key={idx} className={`message `}>
                            <span className={`${message.marker}`}>{`[${message.sender}]:`}</span>
                            <span>{message.data}</span>
                        </div>) }
                </div>
                <div className="inputbox">
                    <input ref={ ref => this.ref.message = ref } name="message" autoFocus/>
                    <button onClick={ this.send }>Send</button>
                </div>


            </div>
        );
    }
}