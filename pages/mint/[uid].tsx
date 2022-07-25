import { Project, NFT, SaleConfig, User } from "@prisma/client";
import { useEthers } from "@usedapp/core";
import { Contract, getDefaultProvider } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { GetServerSideProps, NextPage } from "next";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import toast, { LoaderIcon } from "react-hot-toast";
import { ABI1155, ABI721 } from "../../constants/abis";
import { RPC_URLS } from "../../constants/RPC_URL";
import { service } from "../../service";
import { getRandomUnclaimedNftByProjectId } from "../../services/nft.service";
import { getRandomMessageSignature } from "../../services/platformSigner.service";
import {
  getClaimedSupplyCountByProjectChainAddress,
  getProjectByUid,
  getTotalSupplyCountByProjectChainAddress,
} from "../../services/project.service";
import {
  getCurrentSale,
  getNextSale,
  getSaleConfigProofByProjectId,
} from "../../services/saleConfig.service";
import { getSolVersionConfig } from "../../utils/SaleCOnfig.utils";
import {
  getMintEventArgsMapping,
  normalizeString,
} from "../../utils/String.utils";

interface Props {
  project: Project & {
    owner: User;
    // nfts: NFT[];
  };
  currentSale: SaleConfig | null;
  nextSale: SaleConfig | null;
  configProof: string[] | null;
  totalSupply: number | null;
  claimedSupply: number | null;
  randomMsgSign: {
    message: string;
    signature: string;
  } | null;
}

const MintPage: NextPage<Props> = ({
  project,
  currentSale,
  nextSale,
  configProof,
  claimedSupply,
  totalSupply,
  randomMsgSign,
}) => {
  const { account, chainId, library } = useEthers();
  const [mintBgProc, setMintBgProc] = useState(0);
  const [config, setConfig] = useState({
    userBalance: -1,
    totalMintInSale: -1,
  });
  const router = useRouter();
  const [mintCount, setMintCount] = useState(1);
  useEffect(() => {
    (async () => {
      if (
        !project.address ||
        !project.chainId ||
        !RPC_URLS[project.chainId] ||
        !account ||
        !chainId
      )
        return;
      setConfig((c) => ({ ...c, userBalance: -1 }));
      const contract = new Contract(
        project.address,
        project.collectionType === "721" ? ABI721 : ABI1155,
        getDefaultProvider(RPC_URLS[project.chainId])
      );
      const [userBalance] = (
        await Promise.all([contract.balanceOf(account)])
      ).map((v) => +v.toString());
      setConfig((c) => ({ ...c, userBalance }));
    })();
  }, [
    account,
    chainId,
    currentSale,
    project.address,
    project.chainId,
    project.collectionType,
  ]);
  useEffect(() => {
    (async () => {
      if (
        !project.address ||
        !project.chainId ||
        !RPC_URLS[project.chainId] ||
        !account ||
        !chainId ||
        !currentSale
      )
        return;
      const contract = new Contract(
        project.address,
        project.collectionType === "721" ? ABI721 : ABI1155,
        getDefaultProvider(RPC_URLS[project.chainId])
      );
      const [totalMintInSale] = (
        await Promise.all([
          contract.mintCountByIdentifier(currentSale.saleIdentifier),
        ])
      ).map((v) => +v.toString());
      setConfig((c) => ({ ...c, totalMintInSale }));
    })();
  }, [
    account,
    chainId,
    currentSale,
    project.address,
    project.chainId,
    project.collectionType,
  ]);

  const handleMintClick = async () => {
    if (!project.address || !project.chainId || !RPC_URLS[project.chainId]) {
      toast.error("Error loading project data");
      return;
    }
    if (!currentSale) {
      toast.error("No Sale Running");
      return;
    }
    if (configProof === null) {
      toast.error("Error config proof");
      return;
    }
    if (!account || !chainId || !library) {
      toast.error("Please Connect Wallet");
      return;
    }

    if (!randomMsgSign) {
      toast.error("Error getting platform signature");
      return;
    }

    if (
      currentSale.saleType === "private" &&
      currentSale.whitelist.length <= 1
    ) {
      toast.error("No one is allowed to mint (Empty Whitelist)");
      return;
    }

    if (
      currentSale.saleType === "private" &&
      !currentSale.whitelist.includes(account)
    ) {
      toast.error("You are not whitelisted");
      return;
    }

    if (mintCount + config.userBalance > currentSale.maxMintPerWallet) {
      toast.error("Max mint limit for your wallet exceeds");
      return;
    }

    if (mintCount + config.totalMintInSale > currentSale.maxMintInSale) {
      toast.error("Max limit for sale exceeds");
      return;
    }
    try {
      setMintBgProc((v) => v + 1);
      const { data: whitelistProof } = await service.get(
        `/sale-config/proof/whitelist-proof?identifier=${currentSale.saleIdentifier}&address=${account}`
      );

      const contract = new Contract(
        project.address,
        project.collectionType === "721" ? ABI721 : ABI1155,
        library.getSigner(account)
      );

      const saleConfig = getSolVersionConfig({
        enabled: currentSale.enabled,
        endTime: currentSale.endTime,
        maxMintInSale: currentSale.maxMintInSale,
        maxMintPerWallet: currentSale.maxMintPerWallet,
        mintCharge: currentSale.mintCharge,
        saleType: currentSale.saleType as "public" | "private",
        startTime: currentSale.startTime,
        uuid: currentSale.saleIdentifier,
        whitelistAddresses: currentSale.whitelist,
      });

      const tx = await toast.promise(
        contract.mint(
          configProof,
          whitelistProof.data,
          mintCount,
          randomMsgSign.message,
          randomMsgSign.signature,
          saleConfig,
          {
            value: parseEther((currentSale.mintCharge * mintCount).toFixed(18)),
          }
        ),
        {
          error: "Error sending transaction",
          loading: "Sending transaction...",
          success: "Transaction Sent",
        }
      );

      const receipt = await toast.promise((tx as any).wait(), {
        error: "Error completing transaction",
        loading: "Mining...",
        success: "Transaction Completed",
      });
      console.log(
        getMintEventArgsMapping(
          (receipt as any).events.find((e: any) => e.event === "Mint").args
        )
      );
      const eventData = getMintEventArgsMapping(
        (receipt as any).events.find((e: any) => e.event === "Mint").args
      );
      await toast.promise(
        service.post(`nft/random-unclaimed/attatch`, {
          projectId: project.id,
          fromTokenId: eventData.fromTokenId,
          toTokenId: eventData.toTokenId,
        }),
        {
          error: "Error updating NFT",
          loading: "Updating informations...",
          success: "Mint Successful",
        }
      );
      router.reload();
    } catch (error) {
      setMintBgProc((v) => v - 1);
      toast.error("Error minting");
      console.log("Minting error : ", error);
    }
  };

  return (
    <div>
      <div className="relative h-40 rounded mx-auto aspect-square">
        {project.imageUrl && (
          <Image src={project.imageUrl} layout="fill" alt="" />
        )}
      </div>
      <h1 className="font-bold text-4xl text-center">{project.name}</h1>
      {chainId !== project.chainId && (
        <h2 className="text-center text-red-600">
          Please Switch to network ID : {project.chainId}
        </h2>
      )}
      <div className="mx-auto max-w-md border-2 border-gray-400 bg-gray-200 rounded-xl p-4 mt-10">
        <div className="flex justify-between items-center">
          <h1>Total Supply</h1>
          <h1>{totalSupply}</h1>
        </div>
        <div className="flex justify-between items-center">
          <h1>Already Claimed</h1>
          <h1>{claimedSupply}</h1>
        </div>
        {totalSupply && claimedSupply && (
          <div className="flex justify-between items-center">
            <h1>Unclaimed</h1>
            <h1>{totalSupply - claimedSupply}</h1>
          </div>
        )}
        <div className="flex justify-between items-center">
          <h1>Balance</h1>
          <h1>
            {config.userBalance === -1 ? <LoaderIcon /> : config.userBalance}
          </h1>
        </div>
        <div className="flex justify-between items-center">
          <h1>Sale Status</h1>
          <h1>
            {!!currentSale
              ? normalizeString(currentSale.saleType)
              : !!nextSale
              ? `${normalizeString(
                  nextSale.saleType
                )} Sale starts at ${new Date(
                  nextSale.startTime * 1000
                ).toLocaleString()}`
              : "No Sale is running"}
          </h1>
        </div>
        <div className="flex gap-4 justify-center select-none bg-gray-700 my-4 py-3 text-gray-200 rounded p-2">
          <div className="flex gap-4 justify-center items-center">
            <button
              className="border-2 border-gray-400 rounded-full w-8 h-8 flex justify-center items-center hover:bg-gray-400 hover:text-black transition-colors disabled:cursor-not-allowed"
              onClick={() => setMintCount((v) => (v === 1 ? 1 : v - 1))}
              disabled={mintBgProc > 0}
            >
              -
            </button>
            <span className="w-10 text-center text-2xl">{mintCount}</span>
            <button
              className="border-2 border-gray-400 rounded-full w-8 h-8 flex justify-center items-center hover:bg-gray-400 hover:text-black transition-colors disabled:cursor-not-allowed"
              onClick={() => setMintCount((v) => v + 1)}
              disabled={mintBgProc > 0}
            >
              +
            </button>
          </div>

          <button
            className="border-2 border-gray-400 rounded py-1 px-2 hover:bg-gray-400 hover:text-black transition-colors text-xs disabled:cursor-not-allowed"
            onClick={() => setMintCount(1)}
            disabled={mintBgProc > 0}
          >
            Reset
          </button>
        </div>
        <button
          className="bg-teal-500 font-medium text-4xl text-white rounded hover:bg-teal-600 transition-colors w-full py-4 disabled:bg-teal-400 disabled:text-gray-500 disabled:cursor-not-allowed"
          onClick={handleMintClick}
          disabled={mintBgProc > 0}
        >
          Mint
        </button>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { uid } = context.query;
  if (!uid || typeof uid !== "string")
    return { props: {}, redirect: { destination: "/404" } };
  const project = await getProjectByUid(uid);
  if (!project || !project.address || !project.chainId)
    return { props: {}, redirect: { destination: "/404" } };
  const [currentSale, nextSale, totalSupply, claimedSupply, randomMsgSign] =
    await Promise.all([
      getCurrentSale(project.id).catch((err) => {
        // console.log("Error getting current sale", err);
        return null;
      }),
      getNextSale(project.id).catch((err) => {
        console.log("Error getting next sale", err);
        return null;
      }),
      getTotalSupplyCountByProjectChainAddress(
        project.address,
        project.chainId
      ).catch((err) => {
        console.log("Error getting Total Supply Count : ", err);
        return null;
      }),
      getClaimedSupplyCountByProjectChainAddress(
        project.address,
        project.chainId
      ).catch((err) => {
        console.log("Error getting Claimed Supply Count : ", err);
        return null;
      }),
      getRandomMessageSignature().catch((err) => {
        console.log("Error getting random msg/sign : ", err);
        return null;
      }),
    ]);
  const configProof = !!currentSale
    ? await getSaleConfigProofByProjectId(
        project.id,
        currentSale.saleIdentifier
      ).catch((err) => {
        console.log("Error getting config proof", err);
        return null;
      })
    : null;
  return {
    props: {
      project,
      currentSale,
      nextSale,
      configProof,
      totalSupply,
      claimedSupply,
      randomMsgSign,
    },
  };
};

export default MintPage;
