import React, { useEffect, useState } from "react";
import { BrowserProvider, Contract, ethers } from "ethers";
import { contractABI, contractAddress } from "../utils/constants";

export const TransactionContext = React.createContext();

const { ethereum } = window;

const getEthereumContract = async () => {
  if (!ethereum) {
    console.warn("Ethereum provider not found");
    return null;
  }

  const provider = new BrowserProvider(ethereum);
  const signer = await provider.getSigner();
  const transactionContract = new Contract(contractAddress, contractABI, signer);

  console.log("Contract loaded:", transactionContract.target);
  return transactionContract;
};

export const TransactionProvider = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [formData, setFormData] = useState({
    addressTo: "",
    amount: "",
    keyword: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [transactionCount, setTransactionCount] = useState(localStorage.getItem("transactionCount") || 0);

  const handleChange = (e, name) => {
    setFormData((prevState) => ({ ...prevState, [name]: e.target.value }));
  };

  const checkIfWalletIsConnected = async () => {
    try {
      if (!ethereum) return alert("Please install MetaMask");
      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length) {
        setCurrentAccount(accounts[0]);
      } else {
        console.log("No accounts found");
      }
    } catch (error) {
      console.error(error);
      throw new Error("No ethereum object.");
    }
  };

  const connectWallet = async () => {
    try {
      if (!ethereum) return alert("Please install MetaMask");
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.error(error);
      throw new Error("No ethereum object.");
    }
  };

  const sendTransaction = async () => {
    try {
      if (!ethereum) return alert("Please install MetaMask");

      const { addressTo, amount, keyword, message } = formData;
      const transactionContract = await getEthereumContract();
      if (!transactionContract) return;

      const parsedAmount = ethers.parseEther(amount);

      // Send ETH via MetaMask
      await ethereum.request({
        method: "eth_sendTransaction",
        params: [{
          from: currentAccount,
          to: addressTo,
          gas: "0x5208", // 21000 Gwei in hex
          value: parsedAmount.toString(16),
        }],
      });

      // Call smart contract function
      const transactionHash = await transactionContract.addToBlockchain(
        addressTo,
        parsedAmount,
        message,
        keyword
      );

      setIsLoading(true);
      console.log(`Loading - ${transactionHash.hash}`);
      await transactionHash.wait();
      setIsLoading(false);
      console.log(`Success - ${transactionHash.hash}`);

      const transactionsCount = await transactionContract.getTransactionCount();
      setTransactionCount(transactionsCount.toString());
      localStorage.setItem("transactionCount", transactionsCount.toString());

      // Clear form
      setFormData({ addressTo: "", amount: "", keyword: "", message: "" });
    } catch (error) {
      console.error(error);
      throw new Error("Transaction failed.");
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  return (
    <TransactionContext.Provider
      value={{
        connectWallet,
        currentAccount,
        formData,
        setFormData,
        handleChange,
        sendTransaction,
        isLoading,
        transactionCount,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
