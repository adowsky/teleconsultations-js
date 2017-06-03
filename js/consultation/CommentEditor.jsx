import React from "react";

export default class CommentEditor extends React.Component {
    constructor(...props) {
        super(...props);

        this.state = {
            content: ""
        };
    }

    handle = event => {
        const { value } = event.target;

        this.setState({ content: value });
    };

    render() {
        const style = {
            position: "absolute",
            left: `${this.props.x}px`,
            top: `${this.props.y}px`
        };

        return (
            <div style={style} className="comment-editor">
                <textarea onChange={ this.handle } value={ this.state.content }/>
                <div>
                    <button onClick={ e => this.props.publish(this.state.content) }>Publish</button>
                    <button onClick={ e => this.props.abort() }>Abort</button>
                </div>
            </div>
        )
    }
}
