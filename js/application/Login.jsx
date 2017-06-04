import React from 'react';

export default class HeaderView extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            name: ""
        }
    }

    handle = (event) => {
        const {value} = event.target;

        this.setState({name: value});
    };

    render() {
        return (
            <div className="login">
                <h3>Join the conversation</h3>
                <input name="name" placeholder="Your name" value={this.state.name || ""} onChange={this.handle} autoFocus />
                <button onClick={ () => this.props.login(this.state.name) }>Join consultation</button>
            </div>

        );
    }
}
