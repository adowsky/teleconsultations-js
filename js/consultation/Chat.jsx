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
            <div>
                <div className="message-box">
                    { messages.map((message, idx )=> <div key={idx} className="message">{message}</div>) }
                </div>
                <div className="inputbox">
                    <input ref={ ref =>  this.ref.message = ref } name="message" />
                    <button onClick={ this.send }>Send</button>
                </div>


            </div>
        );
    }
}