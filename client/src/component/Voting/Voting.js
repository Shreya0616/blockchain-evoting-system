import React, { Component } from "react";
import { Link } from "react-router-dom";

import Navbar from "../Navbar/Navigation";
import NavbarAdmin from "../Navbar/NavigationAdmin";
import NotInit from "../NotInit";

import getWeb3 from "../../getWeb3";
import Election from "../../contracts/Election.json";

import "./Voting.css";

export default class Voting extends Component {
  constructor(props) {
    super(props);

    this.state = {
      ElectionInstance: undefined,
      account: null,
      web3: null,
      isAdmin: false,
      electionConfigured: false,
      candidateCount: undefined,
      candidates: [],
      isElStarted: false,
      isElEnded: false,
      currentVoter: {
        address: undefined,
        name: null,
        phone: null,
        hasVoted: false,
        isVerified: false,
        isRegistered: false,
      },
    };
  }

  // Reload when the user changes MetaMask accounts.
  handleAccountsChanged = (accounts) => {
    window.location.reload();
  };

  // Reload when the user changes blockchain networks.
  handleChainChanged = (chainId) => {
    window.location.reload();
  };

  componentDidMount = async () => {
    if (window.ethereum && window.ethereum.on) {
      window.ethereum.on(
        "accountsChanged",
        this.handleAccountsChanged
      );

      window.ethereum.on(
        "chainChanged",
        this.handleChainChanged
      );
    }

    if (!window.location.hash) {
      window.location = window.location + "#loaded";
      window.location.reload();
      return;
    }

    try {
      // Get Web3
      const web3 = await getWeb3();

      // Get accounts
      const accounts = await web3.eth.getAccounts();

      if (!accounts.length) {
        throw new Error(
          "Please connect MetaMask to continue."
        );
      }

      // Get network
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Election.networks[networkId];

      if (!deployedNetwork) {
        throw new Error(
          "Election contract is not deployed on the current network."
        );
      }

      // Create contract instance
      const instance = new web3.eth.Contract(
        Election.abi,
        deployedNetwork.address
      );

      this.setState({
        web3: web3,
        ElectionInstance: instance,
        account: accounts[0],
      });

      // Check admin
      const admin = await instance.methods
        .getAdmin()
        .call();

      if (
        accounts[0].toLowerCase() ===
        admin.toLowerCase()
      ) {
        this.setState({
          isAdmin: true,
        });
      }

      // Check election configuration
      const electionConfigured =
        await instance.methods
          .electionConfigured()
          .call();

      this.setState({
        electionConfigured: electionConfigured,
      });

      // Get candidate count
      const candidateCount =
        await instance.methods
          .getTotalCandidate()
          .call();

      this.setState({
        candidateCount: candidateCount,
      });

      // Get election status
      const start = await instance.methods
        .getStart()
        .call();

      const end = await instance.methods
        .getEnd()
        .call();

      this.setState({
        isElStarted: start,
        isElEnded: end,
      });

      // Load candidates
      const candidates = [];

      for (
        let i = 1;
        i <= Number(candidateCount);
        i++
      ) {
        const candidate = await instance.methods
          .candidates(i)
          .call();

        candidates.push({
          id: candidate.id,
          header: candidate.name,
          slogan: candidate.slogan,
        });
      }

      this.setState({
        candidates: candidates,
      });

      // Get current voter's details
      const voter = await instance.methods
        .getVoterDetails(accounts[0])
        .call({ from: accounts[0] });

      this.setState({
        currentVoter: {
          address: voter[0],
          name: voter[1],
          phone: voter[2],
          isVerified: voter[3],
          hasVoted: voter[4],
          isRegistered: voter[5],
        },
      });
    } catch (error) {
      console.error(error);

      alert(
        "Failed to load Web3, accounts, or contract. " +
        "Check MetaMask network and console for details.\n\n" +
        error.message
      );
    }
  };

  componentWillUnmount() {
    if (
      window.ethereum &&
      window.ethereum.removeListener
    ) {
      window.ethereum.removeListener(
        "accountsChanged",
        this.handleAccountsChanged
      );

      window.ethereum.removeListener(
        "chainChanged",
        this.handleChainChanged
      );
    }
  }

  renderCandidates = (candidate) => {
    const castVote = async (id) => {
      try {
        await this.state.ElectionInstance.methods
          .vote(id)
          .send({
            from: this.state.account,
            gas: 1000000,
          });

        alert("Vote cast successfully!");
        window.location.reload();
      } catch (error) {
        console.error(error);

        if (error.message) {
          alert(
            "Failed to cast vote.\n\n" +
            error.message
          );
        } else {
          alert("Failed to cast vote.");
        }
      }
    };

    const confirmVote = (id, header) => {
      const confirmed = window.confirm(
        "Vote for " +
        header +
        " with Id " +
        id +
        ".\nAre you sure?"
      );

      if (confirmed) {
        castVote(id);
      }
    };

    return (
      <div
        className="container-item"
        key={candidate.id}
      >
        <div className="candidate-info">
          <h2>
            {candidate.header}{" "}
            <small>#{candidate.id}</small>
          </h2>

          <p className="slogan">
            {candidate.slogan}
          </p>
        </div>

        <div className="vote-btn-container">
          <button
            onClick={() =>
              confirmVote(
                candidate.id,
                candidate.header
              )
            }
            className="vote-bth"
            disabled={
              !this.state.isElStarted ||
              this.state.isElEnded ||
              !this.state.currentVoter.isRegistered ||
              !this.state.currentVoter.isVerified ||
              this.state.currentVoter.hasVoted
            }
          >
            Vote
          </button>
        </div>
      </div>
    );
  };

  render() {
    if (!this.state.web3) {
      return (
        <>
          {this.state.isAdmin ? (
            <NavbarAdmin />
          ) : (
            <Navbar />
          )}

          <center>
            Loading Web3, accounts, and contract...
          </center>
        </>
      );
    }

    return (
      <>
        {this.state.isAdmin ? (
          <NavbarAdmin />
        ) : (
          <Navbar />
        )}

        <div>
          {!this.state.electionConfigured ? (
            <NotInit />
          ) : !this.state.isElStarted &&
            !this.state.isElEnded ? (
            <>
              <div className="container-item info">
                <center>
                  <h3>Election is scheduled.</h3>
                  <p>Voting has not started yet.</p>
                  <p>
                    Please wait until the scheduled
                    start time.
                  </p>
                </center>
              </div>

              <div className="container-main">
                <h2>Candidates</h2>

                <small>
                  Total candidates:{" "}
                  {this.state.candidates.length}
                </small>

                {this.state.candidates.length < 1 ? (
                  <div className="container-item attention">
                    <center>
                      No candidates available.
                    </center>
                  </div>
                ) : (
                  <>
                    {this.state.candidates.map(
                      this.renderCandidates
                    )}

                    <div
                      className="container-item"
                      style={{
                        border: "1px solid black",
                      }}
                    >
                      <center>That is all.</center>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : this.state.isElStarted &&
            !this.state.isElEnded ? (
            <>
              {this.state.currentVoter.isRegistered ? (
                this.state.currentVoter.isVerified ? (
                  this.state.currentVoter.hasVoted ? (
                    <div className="container-item success">
                      <div>
                        <strong>
                          You've casted your vote.
                        </strong>

                        <p />

                        <center>
                          <Link
                            to="/Results"
                            style={{
                              color: "black",
                              textDecoration: "underline",
                            }}
                          >
                            See Results
                          </Link>
                        </center>
                      </div>
                    </div>
                  ) : (
                    <div className="container-item info">
                      <center>
                        Go ahead and cast your vote.
                      </center>
                    </div>
                  )
                ) : (
                  <div className="container-item attention">
                    <center>
                      Please wait for admin to verify.
                    </center>
                  </div>
                )
              ) : (
                <div className="container-item attention">
                  <center>
                    <p>
                      You're not registered.
                      Please register first.
                    </p>

                    <br />

                    <Link
                      to="/Registration"
                      style={{
                        color: "black",
                        textDecoration: "underline",
                      }}
                    >
                      Registration Page
                    </Link>
                  </center>
                </div>
              )}

              <div className="container-main">
                <h2>Candidates</h2>

                <small>
                  Total candidates:{" "}
                  {this.state.candidates.length}
                </small>

                {this.state.candidates.length < 1 ? (
                  <div className="container-item attention">
                    <center>
                      No candidates available.
                    </center>
                  </div>
                ) : (
                  <>
                    {this.state.candidates.map(
                      this.renderCandidates
                    )}

                    <div
                      className="container-item"
                      style={{
                        border: "1px solid black",
                      }}
                    >
                      <center>That is all.</center>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : !this.state.isElStarted &&
            this.state.isElEnded ? (
            <>
              <div className="container-item attention">
                <center>
                  <h3>The Election has ended.</h3>
                  <br />

                  <Link
                    to="/Results"
                    style={{
                      color: "black",
                      textDecoration: "underline",
                    }}
                  >
                    See results
                  </Link>
                </center>
              </div>
            </>
          ) : null}
        </div>
      </>
    );
  }
}