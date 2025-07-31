require('@nomiclabs/hardhat-waffle');

module.exports = {
  solidity: '0.8.0',
  networks: {
    sepolia: {
      url: 'https://eth-sepolia.g.alchemy.com/v2/lSI1VhpcJKhDH2nZJjIJa',
      accounts: ['257e61363128d3935c0dcfc6e55a5704a2ec8f3f46ae6aa88400460e812368ac'],
    },
  },
};