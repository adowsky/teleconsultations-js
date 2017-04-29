import React from "react";
import ReactDOM from "react-dom";
import 'webrtc-adapter';

import App from "./application/Application";

ReactDOM.render(<App />, document.querySelector('#app'));