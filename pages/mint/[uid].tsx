import { Project, NFT, SaleConfig, User } from "@prisma/client";
import { shortenIfAddress, useEtherBalance, useEthers } from "@usedapp/core";
import { Contract, getDefaultProvider } from "ethers";
import { formatEther, parseEther } from "ethers/lib/utils";
import { GetServerSideProps, NextPage } from "next";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import toast, { LoaderIcon } from "react-hot-toast";
import Layout from "../../components/Layout";
import { ABI1155, ABI721 } from "../../constants/abis";
import { RPC_URLS } from "../../constants/RPC_URL";
import {
  Collection1155__factory,
  Collection721__factory,
} from "../../ContractFactory";
import type { Collection1155, Collection721 } from "../../ContractFactory";
import { service } from "../../service";
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
  get721MintEventArgsMapping,
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
  const { account, chainId, library, activateBrowserWallet } = useEthers();
  const [mintBgProc, setMintBgProc] = useState(0);
  const [config, setConfig] = useState({
    userBalance: -1,
    totalMintInSale: -1,
    mintCountInSaleByUser: -1,
    maxMintInTotalPerWallet: -1,
  });
  const router = useRouter();
  const [mintCount, setMintCount] = useState(1);
  const userEtherBalance = useEtherBalance(account);

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
      const contract =
        project.collectionType === "721"
          ? Collection721__factory.connect(
              project.address,
              getDefaultProvider(RPC_URLS[project.chainId])
            )
          : Collection1155__factory.connect(
              project.address,
              getDefaultProvider(RPC_URLS[project.chainId])
            );
      const [userBalance, maxMintInTotalPerWallet] = (
        await Promise.all([
          // contract.balanceOf(account),
          project.collectionType === "721"
            ? (contract as Collection721).balanceOf(account)
            : (contract as Collection1155).balanceOf(account, 0),
          contract.maxMintInTotalPerWallet(),
        ])
      ).map((v) => +v.toString());
      setConfig((c) => ({ ...c, userBalance, maxMintInTotalPerWallet }));
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
      // const contract = new Contract(
      //   project.address,
      //   project.collectionType === "721" ? ABI721 : ABI1155,
      //   getDefaultProvider(RPC_URLS[project.chainId])
      // );
      const contract =
        project.collectionType === "721"
          ? Collection721__factory.connect(
              project.address,
              getDefaultProvider(RPC_URLS[project.chainId])
            )
          : Collection1155__factory.connect(
              project.address,
              getDefaultProvider(RPC_URLS[project.chainId])
            );
      const [totalMintInSale, mintCountInSaleByUser] = (
        await Promise.all([
          contract.mintCountByIdentifier(currentSale.saleIdentifier),
          contract.balanceByIdentifier(currentSale.saleIdentifier, account),
        ])
      ).map((v) => +v.toString());
      setConfig((c) => ({ ...c, totalMintInSale, mintCountInSaleByUser }));
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
    if (
      config.maxMintInTotalPerWallet === -1 ||
      config.mintCountInSaleByUser === -1 ||
      config.totalMintInSale === -1 ||
      config.userBalance === -1
    ) {
      toast.error("Error loading data");
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

    if (chainId !== project.chainId) {
      toast.error(`Please connect to network ID : ${project.chainId}`);
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

    if (
      // config.maxMintInTotalPerWallet === 0 ||
      currentSale.maxMintInSale === 0
    ) {
      toast.error("Minting Disabled");
      return;
    }

    if (
      config.maxMintInTotalPerWallet !== 0 &&
      mintCount + config.userBalance > config.maxMintInTotalPerWallet
    ) {
      toast.error("Max mint in total limit for your wallet exceeds");
      return;
    }

    if (
      mintCount + config.mintCountInSaleByUser >
      currentSale.maxMintPerWallet
    ) {
      toast.error("Max mint limit for your wallet exceeds");
      return;
    }

    if (mintCount + config.totalMintInSale > currentSale.maxMintInSale) {
      toast.error("Max limit for sale exceeds");
      return;
    }

    if (totalSupply === null || claimedSupply === null) {
      toast.error("Error getting supply informations");
      return;
    }

    if (
      project.collectionType === "721" &&
      totalSupply - claimedSupply < mintCount
    ) {
      toast.error("Not enough supply");
      return;
    }
    if (!userEtherBalance) {
      toast.error("Error getting user balance");
      return;
    }

    if (
      userEtherBalance.lt(
        parseEther((currentSale.mintCharge * mintCount).toFixed(18))
      )
    ) {
      toast.error("You do not have enough balance");
      return;
    }

    try {
      setMintBgProc((v) => v + 1);
      const { data: whitelistProof } = await service.get(
        `/sale-config/proof/whitelist-proof?identifier=${currentSale.saleIdentifier}&address=${account}`
      );

      // const contract = new Contract(
      //   project.address,
      //   project.collectionType === "721" ? ABI721 : ABI1155,
      //   library.getSigner(account)
      // );

      const contract =
        project.collectionType === "721"
          ? new Collection721__factory(library.getSigner(account)).attach(
              project.address
            )
          : new Collection1155__factory(library.getSigner(account)).attach(
              project.address
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
            value: parseEther(
              (+(currentSale.mintCharge * mintCount).toFixed(18)).toString()
            ).toString(),
          }
        ),
        {
          error: "Error sending transaction",
          loading: "Sending transaction...",
          success: "Transaction Sent",
        }
      );

      const receipt = await toast.promise(tx.wait(), {
        error: "Error completing transaction",
        loading: "Mining... (Do not close this window)",
        success: "Transaction Completed",
      });

      if (project.collectionType === "1155") {
        router.reload();
        return;
      }

      console.log(
        get721MintEventArgsMapping(
          (receipt as any).events.find((e: any) => e.event === "Mint").args
        )
      );
      const eventData = get721MintEventArgsMapping(
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
    <Layout mint>
      <div className="-translate-y-24">
        <div className="relative h-40 sm:h-60 md:h-80 mx-auto translate-y-20 transition-all">
          {!!project.bannerUrl && (
            <Image
              src={project.bannerUrl}
              layout="fill"
              alt=""
              objectFit="cover"
            />
          )}
          {!project.bannerUrl && <div className="h-full w-full bg-gray-200" />}
        </div>
        <div
          className={`relative h-40 rounded overflow-hidden mx-auto aspect-square shadow-xl transition-all ${
            !!project.bannerUrl ? "" : ""
          }`}
        >
          {!!project.imageUrl ? (
            <Image
              src={project.imageUrl}
              layout="fill"
              alt=""
              objectFit="cover"
            />
          ) : (
            <div className="h-full w-full bg-gray-200 border-2 border-gray-300 rounded" />
          )}
        </div>
        <h1 className="font-bold text-4xl text-center my-4 p-1">
          {project.name}
        </h1>
        <p className="text-center font-medium p-1">{project.description}</p>
        {!!account && chainId !== project.chainId && (
          <h2 className="text-center text-red-600 p-1">
            Please Switch to network ID : {project.chainId}
          </h2>
        )}
        <div className="mx-4">
          <div className="mx-auto max-w-md border-2 border-gray-400 bg-gray-200 rounded-xl p-4 mt-10">
            <div className="divide-y-2 divide-gray-300 space-y-2">
              {account ? (
                <div className="flex justify-between items-center">
                  <h1>Wallet</h1>
                  <div className="flex">
                    {shortenIfAddress(account)}
                    <span className="flex items-center">
                      ({" "}
                      {!!userEtherBalance ? (
                        (+formatEther(userEtherBalance)).toFixed(2)
                      ) : (
                        <LoaderIcon />
                      )}{" "}
                      ETH )
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  className="w-full bg-blue-500 rounded text-white min-h-[2.5rem] hover:bg-blue-600 transition-colors"
                  onClick={activateBrowserWallet}
                >
                  Connect Wallet
                </button>
              )}
              {project.collectionType === "721" && (
                <>
                  <div className="flex justify-between items-center">
                    <h1>Total Supply</h1>
                    <h1>{totalSupply}</h1>
                  </div>
                  <div className="flex justify-between items-center">
                    <h1>Already Claimed</h1>
                    <h1>{claimedSupply}</h1>
                  </div>
                  {totalSupply !== null && claimedSupply !== null && (
                    <div className="flex justify-between items-center">
                      <h1>Unclaimed</h1>
                      <h1>{totalSupply - claimedSupply}</h1>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between items-center">
                <h1>You own from this collection</h1>
                <h1>
                  {!account ? (
                    "-"
                  ) : config.userBalance === -1 ? (
                    <LoaderIcon />
                  ) : (
                    config.userBalance
                  )}
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
              disabled={
                mintBgProc > 0 ||
                config.maxMintInTotalPerWallet === -1 ||
                config.mintCountInSaleByUser === -1 ||
                config.totalMintInSale === -1 ||
                config.userBalance === -1
              }
            >
              {config.maxMintInTotalPerWallet === -1 ||
              config.mintCountInSaleByUser === -1 ||
              config.totalMintInSale === -1 ||
              config.userBalance === -1
                ? "Loading... "
                : "Mint "}
              {!!currentSale && (
                <span className="text-lg">
                  {+(currentSale.mintCharge * mintCount).toFixed(8) === 0 ? (
                    "(Free)"
                  ) : (
                    <>
                      ({+(currentSale.mintCharge * mintCount).toFixed(8)} ETH)
                    </>
                  )}
                </span>
              )}
            </button>
          </div>
        </div>
        <div className="h-20"></div>
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { uid } = context.query;
  if (!uid || typeof uid !== "string")
    return { props: {}, redirect: { destination: "/404" } };
  const project = await getProjectByUid(uid).catch((err) => null);
  if (!project || !project.address || !project.chainId)
    return { props: {}, redirect: { destination: "/404" } };
  const [currentSale, nextSale, totalSupply, claimedSupply, randomMsgSign] =
    await Promise.all([
      getCurrentSale(project.id).catch((err) => {
        // console.log("Error getting current sale", err);
        return null;
      }),
      getNextSale(project.id).catch((err) => {
        // console.log("Error getting next sale", err);
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
