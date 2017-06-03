import React from "react";

export default class Photos extends React.Component {
    render() {
        const photoKeys = Object.keys(this.props.photos);
        return (
          <div className="photo-container">
              <h3 className="title">Photos</h3>
              { photoKeys.map((key, idx) => <img key={ idx } src={ this.props.photos[key].photo }
                                                           onClick={ () => this.props.selectImage(key) } />) }
          </div>
        );
    }
}