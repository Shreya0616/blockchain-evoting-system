import React, { Component } from "react";
import getWeb3 from "../getWeb3";
import Election from "../contracts/Election.json";
import Navbar from "./Navbar/Navigation";
import NavbarAdmin from "./Navbar/NavigationAdmin";
import AdminOnly from "./AdminOnly";

export default class ElectionSetup extends Component {
  state = {
    web3: null,
    contract: null,
    account: "",
    isAdmin: false,
    configured: false,
    loading: true,
    saving: false,
    ending: false,

    // Election details
    name: "",
    description: "",
    country: "",
    organization: "",
    type: "General Election",
    electoralLevel: "National",
    region: "",
    constituency: "",
    position: "",

    // Voting schedule
    startTime: "",
    endTime: "",

    // Voter eligibility
    minimumVotingAge: "18",
    eligibilityRequirements:
      "Citizenship and eligibility must be verified",
    verificationMethod: "Manual verification",
  };

  componentDidMount = async () => {
    try {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();

      if (!accounts.length) {
        throw new Error(
          "No wallet account found. Unlock MetaMask."
        );
      }

      const networkId = await web3.eth.net.getId();
      const deployed = Election.networks[networkId];

      if (!deployed || !deployed.address) {
        throw new Error(
          "Election contract not found on this network. Check Ganache and the deployed contract."
        );
      }

      const contract = new web3.eth.Contract(
        Election.abi,
        deployed.address
      );

      const account = accounts[0];
      const admin = await contract.methods.getAdmin().call();

      console.log("Connected wallet:", account);
      console.log("Contract admin:", admin);

      const configured = await contract.methods
        .electionConfigured()
        .call();

      this.setState({
        web3,
        contract,
        account,
        isAdmin:
          account.toLowerCase() === admin.toLowerCase(),
        configured: Boolean(configured),
        loading: false,
      });
    } catch (error) {
      console.error("Election setup error:", error);
      alert(
        error.message ||
          "Unable to load the election contract."
      );
      this.setState({ loading: false });
    }
  };

  handleChange = (event) => {
    this.setState({
      [event.target.name]: event.target.value,
    });
  };

  saveElection = async (event) => {
    event.preventDefault();

    const {
      contract,
      account,
      name,
      type,
      country,
      region,
      constituency,
      startTime,
      endTime,
    } = this.state;

    if (
      !name.trim() ||
      !type.trim() ||
      !country.trim() ||
      !startTime ||
      !endTime
    ) {
      alert(
        "Please fill in Election Name, Type, Country, Start Time, and End Time."
      );
      return;
    }

    const start = Math.floor(
      new Date(startTime).getTime() / 1000
    );
    const end = Math.floor(
      new Date(endTime).getTime() / 1000
    );
    const now = Math.floor(Date.now() / 1000);

    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      start <= now ||
      end <= start
    ) {
      alert(
        "Choose a future start time and an end time after the start."
      );
      return;
    }

    try {
      this.setState({ saving: true });

      await contract.methods
        .setElectionDetails(
          name.trim(),
          type.trim(),
          country.trim(),
          region.trim(),
          constituency.trim(),
          start,
          end
        )
        .send({ from: account, gas: 1000000 });

      this.setState({ configured: true });
      alert("Election details saved successfully!");
    } catch (error) {
      console.error("Save election error:", error);
      alert(
        error?.message ||
          "Could not save election details. Check the wallet and contract."
      );
    } finally {
      this.setState({ saving: false });
    }
  };

  endElection = async () => {
    const { contract, account, ending } = this.state;

    if (!contract || !account || ending) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to end this election? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      this.setState({ ending: true });

      await contract.methods
        .endElection()
        .send({ from: account, gas: 200000 });

      alert("Election ended successfully!");
    } catch (error) {
      console.error("End election error:", error);
      alert(
        error?.message ||
          "Failed to end the election."
      );
    } finally {
      this.setState({ ending: false });
    }
  };

  render() {
    const {
      loading,
      isAdmin,
      configured,
      saving,
      ending,
    } = this.state;

    if (loading) {
      return (
        <>
          <Navbar />
          <center>Loading election contract...</center>
        </>
      );
    }

    if (!this.state.contract) {
      return (
        <>
          <Navbar />
          <center>
            Contract could not be loaded. Check the browser console.
          </center>
        </>
      );
    }

    if (!isAdmin) {
      return (
        <>
          <Navbar />
          <AdminOnly page="Election Configuration Page." />
        </>
      );
    }

    return (
      <>
        <NavbarAdmin />

        <div
          style={{
            maxWidth: "700px",
            margin: "30px auto",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
          }}
        >
          <h2>Election Configuration</h2>

          {configured ? (
            <p>
              Election details have already been saved.
              This contract does not allow configuring
              them again.
            </p>
          ) : (
            <>
              <p>
                Enter the details before registering voters
                or voting.
              </p>

              <form onSubmit={this.saveElection}>
                <label>Election Name</label>
                <input
                  required
                  name="name"
                  value={this.state.name}
                  onChange={this.handleChange}
                  placeholder="e.g. Student Council Election"
                  style={inputStyle}
                />

                <label>Country</label>
                <input
                  required
                  name="country"
                  value={this.state.country}
                  onChange={this.handleChange}
                  placeholder="Enter country name"
                  style={inputStyle}
                />

                <label>Election Type</label>
                <select
                  required
                  name="type"
                  value={this.state.type}
                  onChange={this.handleChange}
                  style={inputStyle}
                >
                  <option>General Election</option>
                  <option>Presidential Election</option>
                  <option>Parliamentary Election</option>
                  <option>State or Regional Election</option>
                  <option>Local Election</option>
                </select>

                <label>State / Region</label>
                <input
                  name="region"
                  value={this.state.region}
                  onChange={this.handleChange}
                  placeholder="Enter state or region"
                  style={inputStyle}
                />

                <label>
                  Constituency / Electoral District
                </label>
                <input
                  name="constituency"
                  value={this.state.constituency}
                  onChange={this.handleChange}
                  placeholder="Enter constituency or district"
                  style={inputStyle}
                />

                <label>Voter Verification Method</label>
                <select
                  required
                  name="verificationMethod"
                  value={this.state.verificationMethod}
                  onChange={this.handleChange}
                  style={inputStyle}
                >
                  <option>Manual verification</option>
                  <option>Government ID verification</option>
                  <option>Institutional ID verification</option>
                </select>

                <label>
                  Election Start Date and Time
                </label>
                <input
                  required
                  type="datetime-local"
                  name="startTime"
                  value={this.state.startTime}
                  onChange={this.handleChange}
                  style={inputStyle}
                />

                <label>
                  Election End Date and Time
                </label>
                <input
                  required
                  type="datetime-local"
                  name="endTime"
                  value={this.state.endTime}
                  onChange={this.handleChange}
                  style={inputStyle}
                />

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "12px 20px",
                    marginTop: "16px",
                    width: "100%",
                    cursor: saving ? "wait" : "pointer",
                  }}
                >
                  {saving
                    ? "Saving to Blockchain..."
                    : "Save Election Details"}
                </button>
              </form>
            </>
          )}

          {configured && (
            <button
              type="button"
              onClick={this.endElection}
              disabled={ending}
              style={{
                padding: "12px 20px",
                marginTop: "16px",
                width: "100%",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: ending ? "wait" : "pointer",
              }}
            >
              {ending ? "Ending Election..." : "End Election"}
            </button>
          )}
        </div>
      </>
    );
  }
}

const inputStyle = {
  display: "block",
  boxSizing: "border-box",
  width: "100%",
  padding: "10px",
  margin: "6px 0 16px",
  border: "1px solid #ccc",
  borderRadius: "6px",
};
