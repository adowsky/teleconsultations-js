import React from 'react';
import { HashRouter as Router, Route, Switch } from 'react-router-dom';

import RestClient from "./RestClient";
import ApplicationView from "./ApplicationView";
import Consultations from "../consultation/Consultations";

export default class Application extends React.Component {
    static childContextTypes = {
        restClient: React.PropTypes.any
    };

    constructor(props) {
        super(props);
        this.restClient = new RestClient();
        console.log("Mounting app");
    }


    getChildContext() {
        return {
            restClient: this.restClient
        };
    }


    render() {
        return (
            <ApplicationView>

                <Router>
                    <div className="root">
                        <Switch>
                            <Route exact path='/' component={ Consultations }/>
                        </Switch>
                    </div>
                </Router>

            </ApplicationView>
        );
    }
}
