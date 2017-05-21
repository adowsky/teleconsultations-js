import React from "react";

export default class Caller extends React.Component {
    constructor(props) {
        super(props);

        this.ref = {
            video: null
        };
    }

    render() {
        return (
            <div>
                <video autoPlay src={ this.props.stream.stream }/>
            </div>
        );
    }
}