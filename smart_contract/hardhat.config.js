require('@nomiclabs/hardhat-waffle');
require('dotenv').config();

module.exports = {
  solidity: '0.8.0',
  networks: {
    sepolia: {
      url: process.env.ALCHEMY_URL, // Alchemy RPC endpoint
      accounts: [process.env.PRIVATE_KEY], // Private key from .env file
    },
  },
};


// 