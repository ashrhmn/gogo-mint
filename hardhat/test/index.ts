import { expect } from "chai";
import {
  AbiCoder,
  arrayify,
  keccak256,
  parseEther,
  solidityKeccak256,
} from "ethers/lib/utils";
import { ethers } from "hardhat";
import MerkleTree from "merkletreejs";

const buf2hex = (buf: Buffer) => `0x${buf.toString("hex")}`;

describe.only("721 new", function () {
  it("Should mint", async function () {
    const startDate = new Date(2022, 6, 2).getTime() / 1000;
    const endDate = new Date(2022, 6, 30).getTime() / 1000;

    const accounts = await ethers.getSigners();
    const leaves = accounts
      .filter((_, i) => i > 5)
      .map((a) => keccak256(a.address));
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const root = buf2hex(tree.getRoot());
    const hash = keccak256(accounts[0].address);
    const Coll721 = await ethers.getContractFactory("Collection721");
    const coll721 = await Coll721.deploy(accounts[0].address, root, 3, 4);
    await coll721.deployed();

    await (await coll721.updatePrivateSale1(startDate - 86400, endDate)).wait();

    const validLeaf = keccak256(accounts[7].address);
    const invalidLeaf = keccak256(accounts[4].address);

    const validProof = tree.getProof(validLeaf).map((p) => buf2hex(p.data));
    const invalidProof = tree.getProof(invalidLeaf).map((p) => buf2hex(p.data));

    const signature1 = await accounts[0].signMessage(
      arrayify(solidityKeccak256(["string"], ["Hello1"]))
    );
    const signature2 = await accounts[0].signMessage(
      arrayify(solidityKeccak256(["string"], ["Hello2"]))
    );
    const signature3 = await accounts[0].signMessage(
      arrayify(solidityKeccak256(["string"], ["Hello3"]))
    );
    const signature4 = await accounts[0].signMessage(
      arrayify(solidityKeccak256(["string"], ["Hello4"]))
    );

    const validPrivateMintTx = await coll721
      .connect(accounts[7])
      .mintPrivateTo(accounts[7].address, "Hello1", validProof, signature1, {
        value: "3",
      });
    await validPrivateMintTx.wait();

    const validPrivateMintTx2 = await coll721
      .connect(accounts[7])
      .mintPrivate("Hello2", validProof, signature2, {
        value: "3",
      });
    await validPrivateMintTx2.wait();

    await (await coll721.updatePublicSale(startDate - 86400, endDate)).wait();

    const validPublicMintTx = await coll721
      .connect(accounts[7])
      .mint(accounts[7].address, "Hello3", signature3, {
        value: "4",
      });
    await validPublicMintTx.wait();

    console.log(
      "Balance : ",
      (await coll721.balanceOf(accounts[7].address)).toString()
    );

    const invalidPrivateMintTx = await coll721
      .connect(accounts[4])
      .mintPrivate("Hello4", invalidProof, signature4);
    await invalidPrivateMintTx.wait();
  });
});

describe("721 Previous", function () {
  it("Should return the new greeting once it's changed", async function () {
    const startDate = new Date(2022, 6, 3).getTime() / 1000;
    const endDate = new Date(2022, 6, 30).getTime() / 1000;

    const accounts = await ethers.getSigners();
    const hash = keccak256(accounts[0].address);
    const Coll721 = await ethers.getContractFactory("Collection721");
    const coll721 = await Coll721.deploy(
      accounts[0].address,
      ["Wave1", "Wave2", "Wave3"],
      [1, 2, 2],
      [1, 2, 3],
      [2, startDate, startDate - 86400],
      [3, endDate, endDate],
      [hash, hash, hash]
    );
    await coll721.deployed();
    // console.log("Collection721 : ", coll721.address);
    // console.log("Current Sale : ", await coll721.currentSale());
    // console.log("Sale Waves : ", await coll721.saleWaves(1));
    // console.log("Block Timestamps : ", (await coll721._now()).toString());
    // console.log("Wave Count : ", (await coll721.totalWaves()).toString());

    const leaves = accounts
      .filter((_, i) => i > 5)
      .map((a) => keccak256(a.address));
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const root = buf2hex(tree.getRoot());

    const updateConfigTx = await coll721.updateSalewaves(
      ["Wave1", "Wave2", "Wave3", "Wave4"],
      [1, 2, 2, 1],
      [1, 2, 3, 4],
      [2, startDate, startDate, startDate - 86400],
      [3, endDate, endDate, 0],
      [hash, hash, hash, root]
    );
    await updateConfigTx.wait();
    // console.log("Current Sale : ", await coll721.currentSale());
    // console.log("Wave Count : ", (await coll721.totalWaves()).toString());

    const validLeaf = keccak256(accounts[7].address);
    const invalidLeaf = keccak256(accounts[4].address);

    const validProof = tree.getProof(validLeaf).map((p) => buf2hex(p.data));
    const invalidProof = tree.getProof(invalidLeaf).map((p) => buf2hex(p.data));

    const signature1 = await accounts[0].signMessage(
      arrayify(solidityKeccak256(["string"], ["Hello1"]))
    );
    const signature2 = await accounts[0].signMessage(
      arrayify(solidityKeccak256(["string"], ["Hello2"]))
    );
    const signature3 = await accounts[0].signMessage(
      arrayify(solidityKeccak256(["string"], ["Hello3"]))
    );

    const validPrivateMintTx = await coll721
      .connect(accounts[7])
      .mintPrivateTo(accounts[7].address, "Hello1", validProof, signature1, {
        value: parseEther("4"),
      });
    await validPrivateMintTx.wait();

    const validPrivateMintTx2 = await coll721
      .connect(accounts[7])
      .mintPrivate("Hello2", validProof, signature2, {
        value: parseEther("4"),
      });
    await validPrivateMintTx2.wait();

    const updateConfigTx1 = await coll721.updateSalewaves(
      ["Wave1", "Wave2", "Wave3", "Wave4", "Wave 5"],
      [1, 2, 2, 1, 2],
      [1, 2, 3, 4, 4],
      [2, startDate, startDate, startDate, startDate],
      [3, endDate, endDate, endDate, 0],
      [hash, hash, hash, root, hash]
    );
    await updateConfigTx1.wait();

    const addWaveTx = await coll721.addWave(
      "Wave 6",
      2,
      5,
      startDate - 86400,
      0,
      hash
    );
    await addWaveTx.wait();
    // console.log("Current Sale : ", await coll721.currentSale());
    // console.log("Wave Count : ", (await coll721.totalWaves()).toString());

    const validPublicMintTx = await coll721
      .connect(accounts[7])
      .mint(accounts[7].address, "Hello3", signature3, {
        value: parseEther("4"),
      });
    await validPublicMintTx.wait();

    console.log(
      "Balance : ",
      (await coll721.balanceOf(accounts[7].address)).toString()
    );

    // const invalidPrivateMintTx = await coll721
    //   .connect(accounts[4])
    //   .mintPrivate("", invalidProof);
    // await invalidPrivateMintTx.wait();
  });
});
