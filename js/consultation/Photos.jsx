import React from "react";

export default class Photos extends React.Component {
    render() {
        return (
          <div className="photo-container">
              { this.props.photos.map((photo, idx) => <img key={ idx } width="300" height="300" src={ photo.photo }
                                                           onClick={ () => this.props.selectImage(idx) } />) } }
          </div>
        );
    }
}