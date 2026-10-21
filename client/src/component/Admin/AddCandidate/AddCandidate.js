import React, { Component } from "react";

import Navbar from "../../Navbar/Navigation";
import NavbarAdmin from "../../Navbar/NavigationAdmin";
import getWeb3 from "../../../getWeb3";
import Election from "../../../contracts/Election.json";
import AdminOnly from "../../AdminOnly";
import "./AddCandidate.css";

export default class AddCandidate extends Component {
  constructor(props) {
    super(props);

    this.state = {
      ElectionInstance: undefined,
      web3: null,
      account: null,
      isAdmin: false,
      candidates: [],
      candidateCount: 0,
      selectedFile: null,
      fileCandidates: [],
      isUploading: false,
    };
  }

  componentDidMount = async () => {
    try {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();

      if (!accounts || accounts.length === 0) {
        throw new Error("No MetaMask account found.");
      }

      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Election.networks[networkId];

      if (!deployedNetwork || !deployedNetwork.address) {
        throw new Error(
          "Contract not found on this network. Check Ganache and deployment."
        );
      }

      const instance = new web3.eth.Contract(
        Election.abi,
        deployedNetwork.address
      );

      const account = accounts[0];

      // Check admin account
      
      const admin = await instance.methods.getAdmin().call();


      const isAdmin =
        account.toLowerCase() === admin.toLowerCase();

      // Load existing candidates
      const count = Number(
        await instance.methods.getTotalCandidate().call()
      );

      const candidates = [];

      // Candidate IDs start from 1 in the smart contract.
      for (let id = 1; id <= count; id++) {
        const candidate = await instance.methods
          .candidates(id)
          .call();

        candidates.push({
          id: Number(candidate.id ?? candidate[0]),
          header: candidate.name ?? candidate[1],
          slogan: candidate.slogan ?? candidate[2],
        });
      }

      this.setState({
        web3,
        ElectionInstance: instance,
        account,
        isAdmin,
        candidates,
        candidateCount: count,
      });
    } catch (error) {
      console.error("Contract initialization error:", error);

      alert(
        "Failed to load Web3, accounts, or contract.\n\n" +
          (error.message || "Check MetaMask and Ganache.")
      );
    }
  };

  // Select candidate CSV
  handleFileChange = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      alert("Please select a CSV file.");
      event.target.value = "";
      return;
    }

    this.setState({
      selectedFile: file,
      fileCandidates: [],
    });

    this.readCSV(file);
  };

  // Read CSV file
  readCSV = (file) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const rows = this.parseCSV(event.target.result);

        if (rows.length < 2) {
          alert(
            "CSV must contain a header and at least one candidate."
          );
          return;
        }

        const headers = rows[0].map((item) =>
          item.trim().toLowerCase()
        );

        const nameIndex = headers.indexOf("name");
        const sloganIndex = headers.indexOf("slogan");

        if (nameIndex === -1 || sloganIndex === -1) {
          alert('CSV must contain "Name" and "Slogan" columns.');
          return;
        }

        const fileCandidates = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];

          if (!row || row.every((item) => !item.trim())) {
            continue;
          }

          const name = (row[nameIndex] || "").trim();
          const slogan = (row[sloganIndex] || "").trim();

          if (!name) {
            alert(`Candidate name is missing in row ${i + 1}.`);
            return;
          }

          if (!slogan) {
            alert(`Candidate slogan is missing for ${name}.`);
            return;
          }

          fileCandidates.push({
            header: name,
            slogan,
          });
        }

        if (fileCandidates.length === 0) {
          alert("No valid candidates found in the CSV.");
          return;
        }

        this.setState({ fileCandidates });
      } catch (error) {
        console.error("CSV parsing error:", error);
        alert("Unable to read the CSV file.");
      }
    };

    reader.onerror = () => {
      alert("Failed to read the CSV file.");
    };

    reader.readAsText(file);
  };

  // Parse CSV, including quoted values
  parseCSV = (text) => {
    const rows = [];
    let row = [];
    let value = "";
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"' && insideQuotes && nextChar === '"') {
        value += '"';
        i++;
      } else if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === "," && !insideQuotes) {
        row.push(value);
        value = "";
      } else if (
        (char === "\n" || char === "\r") &&
        !insideQuotes
      ) {
        if (char === "\r" && nextChar === "\n") {
          i++;
        }

        row.push(value);
        value = "";

        if (row.some((item) => item.trim() !== "")) {
          rows.push(row);
        }

        row = [];
      } else {
        value += char;
      }
    }

    if (value !== "" || row.length > 0) {
      row.push(value);

      if (row.some((item) => item.trim() !== "")) {
        rows.push(row);
      }
    }

    return rows;
  };

  // Add candidates to the blockchain
  addAllCandidates = async () => {
    if (this.state.fileCandidates.length === 0) {
      alert("Please select a valid CSV file first.");
      return;
    }

    const confirmed = window.confirm(
      `Add ${this.state.fileCandidates.length} candidates to the election?`
    );

    if (!confirmed) return;

    try {
      this.setState({ isUploading: true });

      const names = this.state.fileCandidates.map(
        (candidate) => candidate.header
      );

      const slogans = this.state.fileCandidates.map(
        (candidate) => candidate.slogan
      );

      await this.state.ElectionInstance.methods
        .addCandidates(names, slogans)
        .send({
          from: this.state.account,
          gas: 5000000,
        });

      alert("All candidates added successfully!");

      // Reload candidate list without redeploying the contract
      const count = Number(
        await this.state.ElectionInstance.methods
          .getTotalCandidate()
          .call()
      );

      const candidates = [];

      for (let id = 1; id <= count; id++) {
        const candidate = await this.state.ElectionInstance.methods
          .candidates(id)
          .call();

        candidates.push({
          id: Number(candidate.id ?? candidate[0]),
          header: candidate.name ?? candidate[1],
          slogan: candidate.slogan ?? candidate[2],
        });
      }

      this.setState({
        candidates,
        candidateCount: count,
        fileCandidates: [],
        selectedFile: null,
        isUploading: false,
      });
    } catch (error) {
      console.error("Add candidates error:", error);

      alert(
        "Failed to add candidates.\n\n" +
          (error.message || "Check the transaction.")
      );

      this.setState({ isUploading: false });
    }
  };

  render() {
    if (!this.state.web3) {
      return (
        <>
          <Navbar />
          <center>Loading Web3, accounts, and contract...</center>
        </>
      );
    }

    if (!this.state.isAdmin) {
      return (
        <>
          <Navbar />
          <AdminOnly page="Add Candidate Page." />
        </>
      );
    }

    return (
      <>
        <NavbarAdmin />

        <div className="container-main">
          <h2>Upload Candidate Dataset</h2>

          <small>
            Total candidates: {this.state.candidateCount}
          </small>

          <div className="container-item">
            <form
              className="form"
              onSubmit={(event) => event.preventDefault()}
            >
              <label className="label-ac">
                Select Candidate CSV File

                <input
                  className="input-ac"
                  type="file"
                  accept=".csv"
                  onChange={this.handleFileChange}
                />
              </label>

              <p className="note">
                CSV format:
                <br />
                Name,Slogan
                <br />
                Candidate A,People First
                <br />
                Candidate B,Progress for All
              </p>

              <button
                type="button"
                className="btn-add"
                disabled={
                  this.state.fileCandidates.length === 0 ||
                  this.state.isUploading
                }
                onClick={this.addAllCandidates}
              >
                {this.state.isUploading
                  ? "Adding Candidates..."
                  : "Add All Candidates"}
              </button>
            </form>
          </div>
        </div>

        {loadCSVPreview(this.state.fileCandidates)}
        {loadAdded(this.state.candidates)}
      </>
    );
  }
}

// Preview candidates from CSV
export function loadCSVPreview(candidates) {
  if (candidates.length === 0) return null;

  return (
    <div
      className="container-main"
      style={{ borderTop: "1px solid" }}
    >
      <div className="container-item info">
        <center>Candidates from CSV</center>
      </div>

      <div
        className="container-item"
        style={{
          display: "block",
          backgroundColor: "#DDFFFF",
        }}
      >
        {candidates.map((candidate, index) => (
          <div className="container-list" key={index}>
            <strong>
              {index + 1}. {candidate.header}
            </strong>
            <br />
            {candidate.slogan}
          </div>
        ))}
      </div>
    </div>
  );
}

// Display candidates already saved on the blockchain
export function loadAdded(candidates) {
  return (
    <div
      className="container-main"
      style={{ borderTop: "1px solid" }}
    >
      <div className="container-item info">
        <center>Candidates List</center>
      </div>

      {candidates.length === 0 ? (
        <div className="container-item alert">
          <center>No candidates added.</center>
        </div>
      ) : (
        <div
          className="container-item"
          style={{
            display: "block",
            backgroundColor: "#DDFFFF",
          }}
        >
          {candidates.map((candidate) => (
            <div
              className="container-list success"
              key={candidate.id}
            >
              <div
                style={{
                  maxHeight: "21px",
                  overflow: "auto",
                }}
              >
                {candidate.id}.{" "}
                <strong>{candidate.header}</strong>:{" "}
                {candidate.slogan}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
