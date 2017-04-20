import React from 'react';
import {HashRouter as Router, Route, Switch} from 'react-router-dom';

import RestClient from "./RestClient";
import ApplicationView from "./ApplicationView";
import Consultation from "../consultation/Consultation";

export default class Application extends React.Component {
    static childContextTypes = {
        restClient: React.PropTypes.any
    };

    constructor(props) {
        super(props);
        this.restClient = new RestClient();

        this.state = {
            modelField: ""
        }
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
                            <Route exact path='/' component={Consultation}/>
                        </Switch>
                    </div>
                </Router>
            </ApplicationView>
        );
    }
}
