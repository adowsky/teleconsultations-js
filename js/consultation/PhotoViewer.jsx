import React from "react";

export default class PhotoViewer extends React.Component {
    render() {
        if(!this.props.image)
            return null;

        return (
            <div className="photo-viewer">
                <img src={ this.props.image.photo }/>
            </div>
        );
    }
}