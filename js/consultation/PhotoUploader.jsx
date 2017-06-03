import React from "react";

export default class PhotoUploader extends React.Component {
    constructor(...props) {
        super(...props);


        this.ref = {
            file: null
        }
    }

    handle = (event) => {
        const { name, value } = event.target;

        this.setState({ filename: value });
    };

    upload = () => {
        const reader = new FileReader();
        reader.onload = () => {
            const data = reader.result;
            this.props.sendImage(data)
        };

        reader.readAsDataURL(this.ref.file.files[0]);
    };


    render() {
        return (
            <div className="uploader">
                <h3>Upload Photo</h3>
                <input type='file' accept='image/*' ref={ ref => this.ref.file = ref }  />
                <button onClick={ this.upload }>Upload</button>
            </div>
        );
    }


}