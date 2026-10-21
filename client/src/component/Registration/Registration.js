// Node modules
import React, { Component } from "react";

// Components
import Navbar from "../Navbar/Navigation";
import NavbarAdmin from "../Navbar/NavigationAdmin";
import NotInit from "../NotInit";

// CSS
import "./Registration.css";

// Contract
import getWeb3 from "../../getWeb3";
import Election from "../../contracts/Election.json";

export default class Registration extends Component {

  constructor(props) {
    super(props);

    this.state = {
      ElectionInstance: undefined,
      web3: null,
      account: null,
      isAdmin: false,

      isElectionConfigured: false,
      isElStarted: false,
      isElEnded: false,

      voterCount: 0,
      voterId: "",

      voters: [],

      currentVoter: {
        address: undefined,
        name: "",
        phone: "",
        hasVoted: false,
        isVerified: false,
        isRegistered: false,
      },
    };
  }

  // Load Web3, account and contract
  componentDidMount = async () => {

    try {

      const web3 = await getWeb3();

      const accounts = await web3.eth.getAccounts();
      
      if (!accounts.length) {
        alert("Please connect MetaMask to continue.");
        return;
      }
      const networkId = await web3.eth.net.getId();

      const deployedNetwork =
        Election.networks[networkId];

      if (!deployedNetwork) {

        alert(
          "Election contract is not deployed on the current network."
        );

        return;
      }

      const instance = new web3.eth.Contract(
        Election.abi,
        deployedNetwork.address
      );

      const account = accounts[0];

      this.setState({
        web3: web3,
        ElectionInstance: instance,
        account: account,
      });

      // Check admin
      const admin =
        await instance.methods
          .getAdmin()
          .call();

      const isAdmin =
        account.toLowerCase() ===
        admin.toLowerCase();

      this.setState({
        isAdmin: isAdmin,
      });

      // Check election configuration
      const electionConfigured =
        await instance.methods
          .electionConfigured()
          .call();

      this.setState({
        isElectionConfigured:
          electionConfigured,
      });

      // Check election status
      const start =
        await instance.methods
          .getStart()
          .call();

      const end =
        await instance.methods
          .getEnd()
          .call();

      this.setState({
        isElStarted: start,
        isElEnded: end,
      });

      // Get total registered voters
      const voterCount =
        await instance.methods
          .getTotalVoter()
          .call();

      this.setState({
        voterCount: Number(voterCount),
      });

      // Load current voter
      try {

        const currentVoter =
          await instance.methods
            .getVoterDetails(account)
            .call({
              from: account,
            });

        this.setState({
          currentVoter: {
            address: currentVoter[0],
            name: currentVoter[1],
            phone: currentVoter[2],
            isVerified: currentVoter[3],
            hasVoted: currentVoter[4],
            isRegistered: currentVoter[5],
          },
        });

      } catch (error) {

        console.log(
          "Current wallet is not registered."
        );

      }

      // Load all registered voters
      // Admin only
      if (isAdmin) {

        const voters = [];

        for (
          let i = 0;
          i < Number(voterCount);
          i++
        ) {

          try {

            const voterAddress =
              await instance.methods
                .getVoterAddress(i)
                .call({
                  from: account,
                });

            const voter =
              await instance.methods
                .getVoterDetails(
                  voterAddress
                )
                .call({
                  from: account,
                });

            voters.push({
              address: voter[0],
              name: voter[1],
              phone: voter[2],
              isVerified: voter[3],
              hasVoted: voter[4],
              isRegistered: voter[5],
            });

          } catch (error) {

            console.error(
              "Error loading voter:",
              error
            );

          }
        }

        this.setState({
          voters: voters,
        });
      }

    } catch (error) {

      console.error(error);

      alert(
        "Failed to load Web3, accounts, or contract. Check console for details."
      );
    }
  };

  // Update Voter ID
  updateVoterId = (event) => {
    this.setState({
      voterId: event.target.value,
    });
  };

  // Register Voter ID
  registerWithVoterId = async (event) => {

    if (event) {
      event.preventDefault();
    }

    const voterId =
      this.state.voterId.trim();

    if (!voterId) {

      alert(
        "Please enter your Voter ID."
      );

      return;
    }

    try {

      const election = this.state.ElectionInstance;
      const account = this.state.account;
      

      console.log("Contract address:", election.options.address);
      console.log("Voter ID submitted:", JSON.stringify(voterId));
      console.log("Connected account:", account);

// Check whether the voter ID exists before sending a transaction
try {
  await election.methods
    .registerWithVoterId(voterId)
    .call({ from: account });

  console.log("Registration pre-check passed.");
} catch (error) {
  console.error("Registration pre-check failed:", error);
  alert(
    "Registration check failed. Open F12 > Console and check the error."
  );
  return;
}

// Send the transaction only if the pre-check passes
await election.methods
  .registerWithVoterId(voterId)
  .send({
    from: account,
    gas: 300000,
  });

      alert(
        "Voter ID registered successfully!"
      );

      window.location.reload();

    } catch (error) {

      console.error(error);

      let message =
        "Failed to register Voter ID.";

      if (error && error.message) {

        if (
          error.message.includes(
            "Invalid voter ID"
          )
        ) {

          message =
            "Invalid Voter ID. Please check your Voter ID.";

        } else if (
          error.message.includes(
            "Voter ID already used"
          )
        ) {

          message =
            "This Voter ID has already been registered.";

        } else if (
          error.message.includes(
            "Wallet already registered"
          )
        ) {

          message =
            "This MetaMask wallet is already registered.";

        } else if (
          error.message.includes(
            "Election already started"
          )
        ) {

          message =
            "Registration is closed because the election has started.";

        } else {

          message +=
            "\n\n" + error.message;
        }
      }

      alert(message);
    }
  };

  render() {

    // Loading
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

        {!this.state.isElectionConfigured ? (

          <NotInit />

        ) : (

          <>

            {/* Election status */}

            <div className="container-main">

              <div className="container-item info">

                <center>

                  {!this.state.isElStarted &&
                  !this.state.isElEnded ? (

                    <h3>
                      Election is scheduled and has not started yet.
                    </h3>

                  ) : this.state.isElStarted &&
                    !this.state.isElEnded ? (

                    <h3>
                      Election is currently active.
                    </h3>

                  ) : (

                    <h3>
                      Election has ended.
                    </h3>

                  )}

                </center>

              </div>

            </div>


            {/* Total registered voters */}

            <div className="container-item info">

              <p>
                Total registered voters:{" "}
                {this.state.voterCount}
              </p>

            </div>


            {/* Voter Registration */}

            <div className="container-main">

              <h3>
                Voter Registration
              </h3>

              <small>
                Register your eligible Voter ID with your MetaMask wallet.
              </small>

              <div className="container-item">

                <form
                  onSubmit={
                    this.registerWithVoterId
                  }
                >

                  {/* Wallet address */}

                  <div className="div-li">

                    <label className="label-r">

                      MetaMask Account

                      <input
                        className="input-r"
                        type="text"
                        value={
                          this.state.account || ""
                        }
                        style={{
                          width: "400px",
                        }}
                        readOnly
                      />

                    </label>

                  </div>


                  {/* Voter ID */}

                  <div className="div-li">

                    <label className="label-r">

                      Voter ID{" "}

                      <span
                        style={{
                          color: "tomato",
                        }}
                      >
                        *
                      </span>

                      <input
                        className="input-r"
                        type="text"
                        placeholder="eg. V001"
                        value={
                          this.state.voterId
                        }
                        onChange={
                          this.updateVoterId
                        }
                        disabled={this.state.currentVoter.isRegistered || this.state.isElEnded}
                      />

                    </label>

                  </div>


                  {/* Note */}

                  <p className="note">

                    <span
                      style={{
                        color: "tomato",
                      }}
                    >
                      Note:
                    </span>

                    <br />

                    Enter the Voter ID provided in the official voter dataset.

                    <br />

                    Your name and phone number will be automatically retrieved from the voter dataset.

                    <br />

                    Your Voter ID will be linked to this MetaMask wallet.

                  </p>


                  {/* Register button */}

                  <button
                    type="submit"
                    className="btn-add"
                    disabled={
                      this.state.currentVoter.isRegistered ||
                      this.state.isElEnded
                    }
                  >

                    {this.state.currentVoter
                      .isRegistered
                      ? "Registered"
                      : "Register Voter ID"}

                  </button>

                </form>

              </div>

            </div>


            {/* Current voter information */}

            <div
              className="container-main"
              style={{
                borderTop:
                  this.state.currentVoter
                    .isRegistered
                    ? null
                    : "1px solid",
              }}
            >

              {loadCurrentVoter(
                this.state.currentVoter,
                this.state.currentVoter
                  .isRegistered
              )}

            </div>


            {/* Admin voter list */}

            {this.state.isAdmin ? (

              <div
                className="container-main"
                style={{
                  borderTop: "1px solid",
                }}
              >

                <small>
                  Total Registered Voters:{" "}
                  {this.state.voters.length}
                </small>

                {loadAllVoters(
                  this.state.voters
                )}

              </div>

            ) : null}

          </>

        )}

      </>
    );
  }
}


// Current voter information

export function loadCurrentVoter(
  voter,
  isRegistered
) {

  return (
    <>

      <div
        className={
          "container-item " +
          (isRegistered
            ? "success"
            : "attention")
        }
      >

        <center>
          Your Registered Information
        </center>

      </div>

      <div
        className={
          "container-list " +
          (isRegistered
            ? "success"
            : "attention")
        }
      >

        <table>

          <tbody>

            <tr>

              <th>
                Account Address
              </th>

              <td>
                {isRegistered
                  ? voter.address
                  : "Not registered"}
              </td>

            </tr>

            <tr>

              <th>
                Name
              </th>

              <td>
                {isRegistered
                  ? voter.name
                  : "-"}
              </td>

            </tr>

            <tr>

              <th>
                Phone
              </th>

              <td>
                {isRegistered
                  ? voter.phone
                  : "-"}
              </td>

            </tr>

            <tr>

              <th>
                Voted
              </th>

              <td>
                {isRegistered
                  ? voter.hasVoted
                    ? "True"
                    : "False"
                  : "-"}
              </td>

            </tr>

            <tr>

              <th>
                Verification
              </th>

              <td>
                {isRegistered
                  ? voter.isVerified
                    ? "Verified"
                    : "Not Verified"
                  : "-"}
              </td>

            </tr>

            <tr>

              <th>
                Registered
              </th>

              <td>
                {isRegistered
                  ? "True"
                  : "False"}
              </td>

            </tr>

          </tbody>

        </table>

      </div>

    </>
  );
}


// All registered voters

export function loadAllVoters(voters) {

  const renderAllVoters = (voter) => {

    return (

      <div
        className="container-list success"
        key={voter.address}
      >

        <table>

          <tbody>

            <tr>

              <th>
                Account Address
              </th>

              <td>
                {voter.address}
              </td>

            </tr>

            <tr>

              <th>
                Name
              </th>

              <td>
                {voter.name}
              </td>

            </tr>

            <tr>

              <th>
                Phone
              </th>

              <td>
                {voter.phone}
              </td>

            </tr>

            <tr>

              <th>
                Voted
              </th>

              <td>
                {voter.hasVoted
                  ? "True"
                  : "False"}
              </td>

            </tr>

            <tr>

              <th>
                Verified
              </th>

              <td>
                {voter.isVerified
                  ? "Verified"
                  : "Not Verified"}
              </td>

            </tr>

            <tr>

              <th>
                Registered
              </th>

              <td>
                {voter.isRegistered
                  ? "True"
                  : "False"}
              </td>

            </tr>

          </tbody>

        </table>

      </div>
    );
  };

  return (

    <>

      <div className="container-item success">

        <center>
          List of Registered Voters
        </center>

      </div>

      {voters.map(renderAllVoters)}

    </>
  );
}