import React from "react";

import Caller from "./Caller";
import Chat from "./Chat";
import Photos from "./Photos";
import PhotoUploader from "./PhotoUploader";
import SignalingServer from "./SignalingServer";
import PhotoViewer from "./PhotoViewer";
import uuid from "uuid/v4"


export default class Consultations extends React.Component {
    static contextTypes = {
        username: React.PropTypes.string
    };

    constructor(...props) {
        super(...props);
        this.serverClient = new SignalingServer({
                joined: this.onParticipantJoined,
                disconnect: this.onParticipantDisconnect
            }, {
                chat: this.onNewMessage,
                photos: this.onNewPhoto,
                objects: this.onNewObject
            },
            this.context.username);


        this.state = {
            callers: {},
            messages: [],
            markers: {},
            photos: {},
            selectedImageIdx: null,
            serverClient: this.serverClient
        };



        this.availableMarkers = ["marker-1","marker-2", "marker-3", "marker-4", "marker-5", "marker-6", "marker-7"];

    }

    componentDidMount() {
    }

    onParticipantJoined = (participantStream, participantId) => {
        const callers = Object.assign({}, this.state.callers, {
            [participantId]: {
                stream: participantStream,
                marker: this.availableMarkers.pop()
            }
        });
        //     this.state.callers.concat([{
        //     stream: participantStream,
        //     id: participantId
        // }]);
        console.debug(`Registering new Caller: ${participantId}`);
        // const markers = Object.assign({}, this.state.markers, {
        //     [participantId]: this.availableMarkers.pop()
        // });

        this.setState({ callers });
    };

    onParticipantDisconnect = (participantId) => {
        const idx = this.state.callers.map(caller => caller.id).indexOf(participantId);
        const callers = [].concat(this.state.callers);
        this.availableMarkers.push(callers[idx].marker);
        callers.splice(idx, 1);

        this.setState({ callers });
    };

    onNewMessage = (message, sender, displayName) => {
        this.state.messages.push({
                data: message,
                sender: displayName || this.state.callers[sender].displayName,
                marker: (sender) ? this.state.callers[sender].marker : ""
            }
        );
        this.forceUpdate();
    };

    onNewPhoto = (photo, id, sender) => {
        const photos = Object.assign({}, this.state.photos, {
            [id]: {
                photo: photo,
                sender: sender,
                comments: []
            }
        });

        this.setState({ photos });

        if (!this.state.selectedImageIdx) {
            this.setState({ selectedImageIdx: id });
        }
    };

    onNewObject = (object, sender) => {
        switch (object.type) {
            case "comment":
                const newComments = this.state.photos[parobjectsed.id].comments.concat({
                    comment: object.comment,
                    coordinates: object.coordinates,
                    sender: sender
                });

                const updatedPhotos = Object.assign({}, this.state.photos);
                updatedPhotos[object.id].comments = newComments;

                this.setState({ photos: updatedPhotos });
                console.log("Received new comment ", object);
                break;
            case "hello":
                const callers = Object.assign({}, this.state.callers);
                callers[sender].displayName = object.username;
                this.setState({ callers });
                break;
        }
    };

    sendChatMessage = message => {
        this.onNewMessage(message, null, "You");
        this.serverClient.sendChatMessage(message);
    };

    sendImage = image => {
        const id = uuid();
        this.onNewPhoto(image, id);
        this.serverClient.sendImage(image, id);
    };

    onImageSelection = imageIndex => {
        this.setState({ selectedImageIdx: imageIndex })
    };

    sendComment = comment => {
        const object = Object.assign({}, comment, {
            type: "comment"
        });


        this.serverClient.sendObject(object);
        this.onNewObject(JSON.stringify(object), "You");
    };

    render() {
        const callerIds = Object.keys(this.state.callers);
        return (
            <div>
                <div className="menu-chat-bar">
                    <Chat messages={ this.state.messages } send={ this.sendChatMessage }/>
                    <PhotoUploader sendImage={ this.sendImage }/>
                </div>

                <PhotoViewer
                    image={ this.state.photos[this.state.selectedImageIdx] }
                    publishComment={ this.sendComment }
                    photoId={ this.state.selectedImageIdx }
                />

                <Photos photos={ this.state.photos } selectImage={ this.onImageSelection }/>
                <div className="camera-container">
                    <h3>Participants</h3>
                    { callerIds.map((id, idx) => <Caller key={ idx } stream={ this.state.callers[id] }/>) }
                </div>
            </div>
        );
    }

}