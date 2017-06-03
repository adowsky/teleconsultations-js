import React from "react";

import CommentEditor from "./CommentEditor";
import CommentView from "./CommentView";

export default class PhotoViewer extends React.Component {
    constructor(...props) {
        super(...props);

        this.ref = {
            img: null
        };

        this.state = {
            comment: null,
            coords: {}

        };


    };

    registerImage = ref => {
        this.ref.img = ref;

        if (ref) {
            ref.onload = () => {
                this.setState({
                    coords: {
                        width: ref.clientWidth,
                        height: ref.clientHeight
                    }
                });
            }
        } else {
            this.setState({ coords: {} });
        }
    };

    onOverlayClick = event => {
        const x = event.nativeEvent.layerX/ this.state.coords.width;
        const y = event.nativeEvent.layerY/ this.state.coords.height;
        this.setState({
            comment: {
                x: x,
                y: y
            }
        });

    };

    publish = comment => {
        this.props.publishComment({
            comment: comment,
            coordinates: this.state.comment,
            id: this.props.photoId
        });

        this.clearNewComment();
    };

    clearNewComment = () => {
        this.setState({
            comment: null
        })
    };

    render() {
        if (!this.props.image)
            return null;

        const overlayX = this.state.coords.width || 0;
        const overlayY = this.state.coords.height || 0;
        const style = {
            position: "absolute",
            width: `${overlayX}px`,
            height: `${overlayY}px`,
            left: "0px"
        };

        return (
            <div className="photo-viewer">
                <img src={ this.props.image.photo } ref={ this.registerImage }/>

                <span style={ style } className="overlay"  onClick={ this.onOverlayClick }/>
                <CommentView comments={ this.props.image.comments } />
                {
                    (this.state.comment) ?
                        <CommentEditor x={ this.state.comment.x } y={ this.state.comment.y} publish={ this.publish } abort={ this.clearNewComment }/>
                        : null
                }

            </div>
        );
    }
}