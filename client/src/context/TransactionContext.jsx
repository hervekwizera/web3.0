import React, { useEffect, useState } from "react";
// Import BrowserProvider and Contract for ethers v6
import { BrowserProvider, Contract, ethers } from "ethers";

import { contractABI, contractAddress } from "../utils/constants";

export const TransactionContext = React.createContext();

const { ethereum } = window;

// Updated to async because getSigner() is async in ethers v6
const getEthereumContract = async () => {
  if (!ethereum) {
    console.warn("Ethereum provider not found");
    return null;
  }

  // Use BrowserProvider instead of Web3Provider
  const provider = new BrowserProvider(ethereum);

  // getSigner() returns a promise, so await it
  const signer = await provider.getSigner();

  // Create contract instance with signer
  const transactionContract = new Contract(contractAddress, contractABI, signer);

  console.log({
    provider,
    signer,
    transactionContract,
  });
console.log("Contract address:", transactionContract.target);

  return transactionContract;
};

export const TransactionProvider = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [formData, setFormData] = useState({ addressTo: "", amount: "", keyword: "", message: "" });

  const handleChange = (e, name) => {
    setFormData((prevState) => ({ ...prevState, [name]: e.target.value }));
  };

  const checkIfWalletIsConnected = async () => {
    try {
      if (!ethereum) return alert("Please install metamask");

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      if (accounts.length) {
        setCurrentAccount(accounts[0]);
        // getAllTransactions();
      } else {
        console.log("No accounts found");
      }

      console.log(accounts);
    } catch (error) {
      console.log(error);
      throw new Error("no ethereum object.");
    }
  };

  const connectWallet = async () => {
    try {
      if (!ethereum) return alert("Please install metamask");
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
      throw new Error("no ethereum object.");
    }
  };

  const sendTransaction = async () => {
    try {
      if (!ethereum) return alert("Please install metamask");
      const { addressTo, amount, keyword, message } = formData;

      // Await the async getEthereumContract here
      const transactionContract = await getEthereumContract();
      if (!transactionContract) return;

      // Example: You can now interact with the contract using transactionContract
      // For instance, parse amount and call a contract method here
      const parsedAmount = ethers.parseEther(amount);

      // You can add your transaction logic here, e.g.:
      // const tx = await transactionContract.someMethod(addressTo, parsedAmount, message, keyword);
      // await tx.wait();

      console.log("Ready to send transaction", { addressTo, amount, keyword, message });
    } catch (error) {
      console.log(error);
      throw new Error("no ethereum object.");
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  return (
    <TransactionContext.Provider value={{ connectWallet, currentAccount, formData, setFormData, handleChange, sendTransaction }}>
      {children}
    </TransactionContext.Provider>
  );
};
