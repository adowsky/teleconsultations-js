import React from "react";

export default class Photos extends React.Component {
    constructor(...props) {
        super(...props);
        this.ref = {
            photos: []
        };

        this.state = {
            renderedPhotos: []
        };

    }

    componentDidUpdate() {
        // const rendered = [];
        // for( let i = this.state.renderedPhotos.length; i < this.props.photos.length; i++) {
        //     const context = this.ref.photos[i].getContext("2d");
        //     context.drawImage(this.props.photos[i].photo, 0, 0);
        //     rendered.push(i);
        // }
        //
        // if(rendered.length > 0) {
        //     this.setState({ renderedPhotos: this.state.renderedPhotos.concat(rendered) });
        // }
    }

    render() {
        return (
          <div>
              { this.props.photos.map((photo, idx) => <img width="300" height="300" src={ photo.photo }/>) } }
              {/*{ this.props.photos((photo, idx) => <canvas width="300" height="300" ref={ ref => this.ref.photos[idx] = ref }/>) }*/}
          </div>
        );
    }
}