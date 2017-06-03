import React from "react";

export default class Photos extends React.Component {
    render() {
        const photoKeys = Object.keys(this.props.photos);
        return (
          <div className="photo-container">
              { photoKeys.map((key, idx) => <img key={ idx } width="300" height="300" src={ this.props.photos[key].photo }
                                                           onClick={ () => this.props.selectImage(key) } />) } }
          </div>
        );
    }
}