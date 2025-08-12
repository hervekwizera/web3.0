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

  // ✅ Transactions state initialized as an empty array
  const [transactions, setTransactions] = useState([]);

  const handleChange = (e, name) => {
    setFormData((prevState) => ({ ...prevState, [name]: e.target.value }));
  };

  const checkIfWalletIsConnected = async () => {
    try {
      if (!ethereum) return alert("Please install MetaMask");
      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length) {
        setCurrentAccount(accounts[0]);
        await getAllTransactions();
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
      await getAllTransactions();
    } catch (error) {
      console.error(error);
      throw new Error("No ethereum object.");
    }
  };

  // ✅ Fetch all past transactions
  const getAllTransactions = async () => {
    try {
      if (!ethereum) return alert("Please install MetaMask");
      const transactionContract = await getEthereumContract();
      if (!transactionContract) return;

      const availableTransactions = await transactionContract.getAllTransactions();

      const structuredTransactions = availableTransactions.map((tx) => ({
        addressTo: tx.receiver,
        addressFrom: tx.sender,
        timestamp: new Date(Number(tx.timestamp) * 1000).toLocaleString(),
        message: tx.message,
        keyword: tx.keyword,
        amount: Number(tx.amount) / 1e18, // Convert Wei to ETH
      }));

      setTransactions(structuredTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const sendTransaction = async () => {
    try {
      if (!ethereum) return alert("Please install MetaMask");

      const { addressTo, amount, keyword, message } = formData;
      const transactionContract = await getEthereumContract();
      if (!transactionContract) return;

      const parsedAmount = ethers.parseEther(amount);

      await ethereum.request({
        method: "eth_sendTransaction",
        params: [{
          from: currentAccount,
          to: addressTo,
          gas: "0x5208", // 21000 Gwei in hex
          value: parsedAmount.toString(16),
        }],
      });

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

      await getAllTransactions();

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
        transactions, // ✅ Now provided
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
