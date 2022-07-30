import { useEthers } from "@usedapp/core";
import { getDefaultProvider } from "ethers";
import React from "react";
import Layout from "../components/Layout";
import { RPC_URLS } from "../constants/RPC_URL";
import { Collection721__factory } from "../typechain-types";

const Test = () => {
  const { library, account } = useEthers();
  const testClick = async () => {
    if (!library || !account) return;
    const Collection721 = Collection721__factory.connect(
      "0x264bE809bE57aD9381144712A220B8b42f45a521",
      library.getSigner(account)
    );

    const tx = await Collection721.updateMaxMintInTotalPerWallet(100);
    const rec = await tx.wait();
    console.log(rec);
  };
  return (
    <Layout dashboard>
      <h1>Test</h1>
      <button onClick={testClick}>Click</button>
    </Layout>
  );
};

export default Test;
