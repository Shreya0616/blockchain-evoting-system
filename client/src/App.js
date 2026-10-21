import React, { Component } from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

import Home from "./component/Home";
import Voting from "./component/Voting/Voting";
import Results from "./component/Results/Results";
import Registration from "./component/Registration/Registration";

import AddCandidate from "./component/Admin/AddCandidate/AddCandidate";
import AdminVoters from "./component/AdminVoters/AdminVoters";
import Verification from "./component/Admin/Verification/Verification";

import AdminLogin from "./component/AdminLogin/AdminLogin";
import AdminRoute from "./component/AdminRoute/AdminRoute";

import test from "./component/test";
import Footer from "./component/Footer/Footer";
import "./App.css";

import ElectionSetup from "./component/ElectionSetup";

export default class App extends Component {
  render() {
    return (
      <div className="App">
        <Router>
          <Switch>
            <Route exact path="/" component={Home} />

            <Route
              exact
              path="/ElectionSetup"
              render={(props) => (
                <AdminRoute
                  {...props}
                  component={ElectionSetup}
                />
              )}
            />

            <Route
              exact
              path="/AdminVoters"
              render={(props) => (
                <AdminRoute
                  {...props}
                  component={AdminVoters}
                />
              )}
            />

            <Route
              exact
              path="/Verification"
              render={(props) => (
                <AdminRoute
                  {...props}
                  component={Verification}
                />
              )}
            />

            <Route
              exact
              path="/AddCandidate"
              render={(props) => (
                <AdminRoute
                 {...props}
                 component={AddCandidate}
              />
            )}
          />

            <Route exact path="/Voting" component={Voting} />
            <Route exact path="/Results" component={Results} />
            <Route exact path="/Registration" component={Registration} />
            <Route exact path="/test" component={test} />
            <Route exact path="/AdminLogin" component={AdminLogin} />

            <Route exact path="*" component={NotFound} />
          </Switch>
        </Router>

        <Footer />
      </div>
    );
  }
}

class NotFound extends Component {
  render() {
    return (
      <>
        <h1>404 NOT FOUND!</h1>
        <center>
          <p>
            The page you are looking for doesn't exist.
            <br />
            Go to{" "}
            <Link
              to="/"
              style={{
                color: "black",
                textDecoration: "underline"
              }}
            >
              Home
            </Link>
          </p>
        </center>
      </>
    );
  }
}
