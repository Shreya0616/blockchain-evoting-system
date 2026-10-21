import React, { Component } from "react";

import NavbarAdmin from "../Navbar/NavigationAdmin";

import getWeb3 from "../../getWeb3";
import Election from "../../contracts/Election.json";

export default class AdminVoters extends Component {

  constructor(props) {
    super(props);

    this.state = {
      web3: null,
      account: null,
      ElectionInstance: null,

      isAdmin: false,

      fileName: "",
      voterData: [],

      uploading: false,
      message: "",
    };
  }

  componentDidMount = async () => {

    try {

      const web3 = await getWeb3();
      console.log("Web3 loaded");

      const accounts =
        await web3.eth.getAccounts();

      const networkId =
        await web3.eth.net.getId();

      const deployedNetwork =
        Election.networks[networkId];

      if (!deployedNetwork) {

        alert(
          "Election contract is not deployed on the current network."
        );

        return;
      }

      const instance =
        new web3.eth.Contract(
          Election.abi,
          deployedNetwork.address
        );

        console.log("Contract address:", deployedNetwork.address);

      const account = accounts[0];

      const admin =
        await instance.methods
          .getAdmin()
          .call();

      const isAdmin =
        account.toLowerCase() ===
        admin.toLowerCase();

      this.setState({
        web3: web3,
        account: account,
        ElectionInstance: instance,
        isAdmin: isAdmin,
      });
      

    } catch (error) {

      console.error(error);

      alert(
        "Failed to load Web3, account or contract."
      );
    }
  };


  // Read CSV file

  handleFile = (event) => {

    const file =
      event.target.files[0];

    if (!file) {
      return;
    }

    if (
      !file.name
        .toLowerCase()
        .endsWith(".csv")
    ) {

      alert(
        "Please select a CSV file."
      );

      return;
    }

    this.setState({
      fileName: file.name,
      voterData: [],
      message: "",
    });

    const reader =
      new FileReader();

    reader.onload = (e) => {

      try {

        const text =
          e.target.result;

        const lines =
          text
            .split(/\r?\n/)
            .filter(
              (line) =>
                line.trim() !== ""
            );

        if (lines.length < 2) {

          alert(
            "CSV file does not contain voter data."
          );

          return;
        }

        const headers =
          lines[0]
            .split(",")
            .map(
              (header) =>
                header.trim()
            );

        if (
          headers[0] !== "VoterID" ||
          headers[1] !== "Name" ||
          headers[2] !== "Phone"
        ) {

          alert(
            "CSV headers must be: VoterID,Name,Phone"
          );

          return;
        }

        const voters = [];

        for (
          let i = 1;
          i < lines.length;
          i++
        ) {

          const values =
            lines[i]
              .split(",")
              .map(
                (value) =>
                  value.trim()
              );

          if (
            values.length < 3
          ) {
            continue;
          }

          const voterId =
            values[0];

          const name =
            values[1];

          const phone =
            values[2];

          if (
            !voterId ||
            !name ||
            !phone
          ) {
            continue;
          }

          voters.push({
            voterId: voterId,
            name: name,
            phone: phone,
          });
        }

        if (
          voters.length === 0
        ) {

          alert(
            "No valid voters found in CSV."
          );

          return;
        }

        this.setState({
          voterData: voters,
          message:
            voters.length +
            " voters loaded from CSV.",
        });

      } catch (error) {

        console.error(error);

        alert(
          "Failed to read CSV file."
        );
      }
    };

    reader.readAsText(file);
  };


  // Upload voters to blockchain

  uploadVoters = async () => {

    const {
      ElectionInstance,
      account,
      voterData,
    } = this.state;

    if (!this.state.isAdmin) {

      alert(
        "Only admin can upload voter dataset."
      );

      return;
    }

    if (
      voterData.length === 0
    ) {

      alert(
        "Please select the voter CSV file first."
      );

      return;
    }

    const voterIds =
      voterData.map(
        (voter) =>
          voter.voterId
      );

    const names =
      voterData.map(
        (voter) =>
          voter.name
      );

    const phones =
      voterData.map(
        (voter) =>
          voter.phone
      );

    try {

      this.setState({
        uploading: true,
        message:
          "Uploading voter dataset to blockchain...",
      });

      ;
console.log("Starting voter upload");
console.log("Admin account:", account);
console.log("Sending addVoters transaction...");

await ElectionInstance.methods
  .addVoters(voterIds, names, phones)
  .send({
    from: account,
    gas: 5000000,
  })
  .on("transactionHash", (hash) => {
    console.log("Transaction hash:", hash);
  })
  .on("receipt", (receipt) => {
    console.log("Transaction receipt:", receipt);
    console.log("Upload transaction status:", receipt.status);
    console.log(
      "Upload contract address:",
      ElectionInstance.options.address
    );
  })
  .on("error", (error) => {
    console.error("Transaction error:", error);
  });

console.log(
  "Network ID:",
  await this.state.web3.eth.net.getId()
);

      this.setState({
        uploading: false,
        message:
          "Voter dataset uploaded successfully.",
      });

      alert("Voter dataset uploaded successfully!");

    } catch (error) {

      console.error(error);

      this.setState({
        uploading: false,
        message:
          "Failed to upload voter dataset.",
      });

      if (
        error.message &&
        error.message.includes(
          "Voter ID already exists"
        )
      ) {

        alert(
          "One or more Voter IDs already exist in the blockchain."
        );

      } else if (
        error.message &&
        error.message.includes(
          "Election already started"
        )
      ) {

        alert(
          "Voter dataset cannot be uploaded after the election starts."
        );

      } else {

        alert(
          "Failed to upload voter dataset. Check the browser console."
        );
      }
    }
  };


  render() {

    if (!this.state.web3) {

      return (
        <>
          <NavbarAdmin />

          <center>
            Loading Web3, account and contract...
          </center>
        </>
      );
    }

    if (!this.state.isAdmin) {

      return (
        <>
          <center>

            <h2>
              Access Denied
            </h2>

            <p>
              Only the election administrator can upload voter datasets.
            </p>

          </center>
        </>
      );
    }

    return (
      <>

        <NavbarAdmin />

        <div
          className="container-main"
        >

          <h2>
            Voter Dataset Upload
          </h2>

          <p>
            Upload the official voter CSV file before the election starts.
          </p>


          <div
            className="container-item"
          >

            <h3>
              Select Voter CSV
            </h3>

            <input
              type="file"
              accept=".csv"
              onChange={
                this.handleFile
              }
            />

            {this.state.fileName && (

              <p>
                Selected file:{" "}
                {this.state.fileName}
              </p>

            )}

            {this.state.message && (

              <p>
                {this.state.message}
              </p>

            )}

          </div>


          {this.state.voterData.length >
            0 && (

            <div
              className="container-item"
            >

              <h3>
                Voter Preview
              </h3>

              <table>

                <thead>

                  <tr>

                    <th>
                      Voter ID
                    </th>

                    <th>
                      Name
                    </th>

                    <th>
                      Phone
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {this.state.voterData.map(
                    (voter, index) => (

                      <tr key={index}>

                        <td>
                          {voter.voterId}
                        </td>

                        <td>
                          {voter.name}
                        </td>

                        <td>
                          {voter.phone}
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

              <br />

              <button
                className="btn-add"
                onClick={
                  this.uploadVoters
                }
                disabled={
                  this.state.uploading
                }
              >

                {this.state.uploading
                  ? "Uploading..."
                  : "Upload Voter Dataset"}

              </button>

            </div>

          )}

        </div>

      </>
    );
  }
}