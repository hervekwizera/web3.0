const { expect } = require("chai");

describe("Transactions Contract", function () {
  let Transactions;
  let transactions;
  let owner;
  let addr1;

  beforeEach(async function () {
    Transactions = await ethers.getContractFactory("Transactions");
    [owner, addr1] = await ethers.getSigners();
    transactions = await Transactions.deploy();
    await transactions.deployed();
  });

  it("Should start with zero transaction count", async function () {
    expect(await transactions.getTransactionCount()).to.equal(0);
  });

  it("Should add a transaction to the blockchain", async function () {
    const amount = ethers.utils.parseEther("1.0"); // 1 ETH
    const message = "Hello Blockchain";
    const keyword = "Test";

    const tx = await transactions.addToBlockchain(addr1.address, amount, message, keyword);
    await tx.wait();

    expect(await transactions.getTransactionCount()).to.equal(1);

    const allTx = await transactions.getAllTransactions();
    expect(allTx.length).to.equal(1);
    expect(allTx[0].sender).to.equal(owner.address);
    expect(allTx[0].receiver).to.equal(addr1.address);
    expect(allTx[0].amount.toString()).to.equal(amount.toString());
    expect(allTx[0].message).to.equal(message);
    expect(allTx[0].keyword).to.equal(keyword);
  });
});
