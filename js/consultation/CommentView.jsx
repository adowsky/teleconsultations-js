import React from "react";

export default class CommentView extends React.Component {
    constructor(...props) {
        super(...props);

        this.state = {
            actives: []
        }
    }


    onMarkerClick = (idx) => {

        if(this.state.actives.includes(idx)){
            const index = this.state.actives.indexOf(idx);
            this.state.actives.splice(index, 1);
            this.forceUpdate();
        } else {
            this.state.actives.push(idx);
            this.forceUpdate();
        }
    };


    render() {
        const positionStyleOf = (comment) => {
          return {
              left: `${comment.coordinates.x*100}%`,
              top: `${comment.coordinates.y*100}%`,
              position: "absolute",
          }
        };

        const markerActivationStyle = (idx) => {
            return (this.state.actives.includes(idx)) ? "active" : "";
        };

        return (
            <div className="comments">
                {this.props.comments.map((comment, idx) =>
                    <div className="comment" style={ positionStyleOf(comment) } key={ idx }>
                        <span className={ `marker ${markerActivationStyle(idx)}` } onClick={ () => this.onMarkerClick(idx) }/>
                        <div className="content">
                            <p>{comment.comment}</p>
                            <h3>{`written by ${comment.sender}`}</h3>
                        </div>
                </div>)}
            </div>
        )
    }
}
