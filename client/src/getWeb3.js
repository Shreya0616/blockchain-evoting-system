
import Web3 from "web3";

const getWeb3 = async () => {
  // Wait for the browser to finish loading only if necessary.
  if (document.readyState === "loading") {
    await new Promise((resolve) => {
      window.addEventListener("load", resolve, { once: true });
    });
  }

  // Use the MetaMask provider.
  if (window.ethereum) {
    const web3 = new Web3(window.ethereum);

    // Ask the user to connect their account.
    await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    return web3;
  }

  // Do not silently use Ganache without a wallet.
  throw new Error(
    "MetaMask was not detected. Open this website in Chrome with MetaMask enabled."
  );
};

export default getWeb3;
