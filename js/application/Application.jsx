import React from 'react';
import { HashRouter as Router, Route, Switch, Redirect } from 'react-router-dom';

import RestClient from "./RestClient";
import ApplicationView from "./ApplicationView";
import Consultations from "../consultation/Consultations";
import Login from "./Login";

export default class Application extends React.Component {
    static childContextTypes = {
        restClient: React.PropTypes.any,
        username: React.PropTypes.string
    };

    constructor(...props) {
        super(...props);
        this.restClient = new RestClient();
        console.log("Mounting app");

        this.state = {
            username: null
        }
    }


    getChildContext() {
        return {
            restClient: this.restClient,
            username: this.state.username

        };
    }

    login = (username) => {
        if(username) {
            this.setState({username});
        }
    };


    render() {

        return (
            <ApplicationView>

                <Router>
                    <div className="root">
                        <Switch>
                            {(!this.state.username) ?
                                <Route exact path="/login" render={() => <Login login={ this.login }/>}/>
                                : <Route exact path='/consultation' component={ Consultations }/>}

                            <Route exact path='/*'>
                                {   (!this.state.username) ?
                                    <Redirect to="/login"/>
                                    : <Redirect to="/consultation"/>
                                }
                            </Route>


                        </Switch>
                    </div>
                </Router>

            </ApplicationView>
        );
    }
}
