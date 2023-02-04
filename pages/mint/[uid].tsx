import { Project, SaleConfig, User, WhitelistLimits } from "@prisma/client";
import { shortenIfAddress, useEthers } from "@usedapp/core";
import { BigNumber, providers } from "ethers";
import { formatEther, parseEther } from "ethers/lib/utils";
import { GetServerSideProps, NextPage } from "next";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import toast, { LoaderIcon } from "react-hot-toast";
import Layout from "../../components/Layout";
import { RPC_URLS } from "../../constants/RPC_URL";
import {
  Collection1155__factory,
  Collection721__factory,
} from "../../ContractFactory";
import type { Collection1155, Collection721 } from "../../ContractFactory";
import { service } from "../../service";
import {
  getProjectByUid,
  getTotalSupplyCountByProjectChainAddress,
} from "../../services/project.service";
import { getBasicCurrentSale } from "../../services/saleConfig.service";
import { normalizeString } from "../../utils/String.utils";
import { walletConnectConnector } from "../../lib/connectors";
import { getParsedEthersError } from "@enzoferey/ethers-error-parser";
import { multiply } from "../../utils/Number.utils";
import { ISaleConfigSol } from "../../types";
import { getIfCached } from "../../lib/redis";

interface Props {
  project: Project & {
    owner: User;
    // nfts: NFT[];
  };
  currentSale: {
    saleIdentifier: string;
    saleType: string;
    mintCharge: number;
  } | null;
  nextSale:
    | (SaleConfig & {
        whitelist: WhitelistLimits[];
      })
    | null;
  // configProof: string[] | null;
  totalSupply: number | null;
  claimedSupply: number;
  randomMsgSign: {
    message: string;
    signature: string;
  } | null;
}

const MintPage: NextPage<Props> = ({
  project,
  currentSale,
  nextSale,
  // claimedSupply,
  totalSupply,
  // randomMsgSign,
}) => {
  const { account, chainId, library, activateBrowserWallet, activate } =
    useEthers();
  const [mintBgProc, setMintBgProc] = useState(0);
  const [config, setConfig] = useState({
    userBalance: -1,
    totalMintInSale: -1,
    mintCountInSaleByUser: -1,
    maxMintInTotalPerWallet: -1,
    maxMintCap: -1,
    totalMintCount: -1,
    claimedSupply: 0,
  });
  const router = useRouter();
  const [mintCount, setMintCount] = useState(1);
  const [userEtherBalance, setUserEtherBalance] = useState<
    BigNumber | undefined
  >(undefined);

  useEffect(() => {
    (async () => {
      if (!library || !account) return;
      const signer = library.getSigner(account);
      const balance = await signer.getBalance();
      setUserEtherBalance(balance);
    })();
  }, [account, library, chainId]);

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
              new providers.StaticJsonRpcProvider(RPC_URLS[project.chainId])
            )
          : Collection1155__factory.connect(
              project.address,
              new providers.StaticJsonRpcProvider(RPC_URLS[project.chainId])
            );
      const [userBalance, claimedSupply] = (
        await Promise.all([
          project.collectionType === "721"
            ? (contract as Collection721).balanceOf(account)
            : (contract as Collection1155).balanceOf(account, 0),
          (contract as Collection721)
            .tokenId()
            .then((v) => v.toNumber() - 1)
            .catch(() => 0),
        ])
      ).map((v) => +v.toString());
      setConfig((c) => ({
        ...c,
        userBalance,
        claimedSupply,
      }));
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
    if (mintCount < 1) {
      toast.error("Mint Count must be at least 1");
      return;
    }
    if (!currentSale) {
      toast.error("No Sale Running");
      return;
    }

    // if (configProof === null) {
    //   toast.error("Error config proof");
    //   return;
    // }
    if (!account || !chainId || !library) {
      toast.error("Please Connect Wallet");
      return;
    }

    if (chainId !== project.chainId) {
      toast.error(`Please connect to network ID : ${project.chainId}`);
      return;
    }

    if (totalSupply === null) {
      toast.error("Error getting supply informations");
      return;
    }

    if (project.collectionType === "1155" && totalSupply === 0) {
      toast.error("Supply not Provided");
      return;
    }

    if (
      project.collectionType === "721" &&
      totalSupply - config.claimedSupply < mintCount
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

      // const tokenGatedMintSignature = await (async () => {
      //   if (
      //     !currentSale.tokenGatedAddress ||
      //     currentSale.tokenGatedAddress === ethers.constants.AddressZero
      //   )
      //     return;
      //   return await toast.promise(
      //     library
      //       .getSigner(account)
      //       .signMessage(getMessageToSignOnTokenGatedMint(account, mintCount)),
      //     {
      //       error: "Error getting signature approval",
      //       loading: "Awaiting signature approval for token gated mint...",
      //       success: "",
      //     },
      //     {
      //       success: { style: { display: "none" } },
      //     }
      //   );
      // })();

      // const [{ data: whitelistProof }, randomMsgSign] = await toast.promise(
      //   Promise.all([
      //     service.get(
      //       `/sale-config/proof/whitelist-proof?identifier=${currentSale.saleIdentifier}&address=${account}`
      //     ),
      //     service
      //       .post(`/platform-signer/signature`, {
      //         account,
      //         chainId,
      //         projectId: project.id,
      //         mintCount,
      //         signature: tokenGatedMintSignature,
      //       })
      //       .then((res) => res.data.data)
      //       .catch((err) => {
      //         // console.log("Mint Signature Error : ", err);
      //         throw err.response.data.error;
      //       }),
      //   ]),
      //   { error: "", loading: "Preparing...", success: "" },
      //   {
      //     success: { style: { display: "none" } },
      //     error: { style: { display: "none" } },
      //   }
      // );

      // if (!randomMsgSign) throw "Error getting platform signature";

      const contract =
        project.collectionType === "721"
          ? new Collection721__factory(library.getSigner(account)).attach(
              project.address
            )
          : new Collection1155__factory(library.getSigner(account)).attach(
              project.address
            );

      // const saleConfig = getSolVersionConfig({
      //   enabled: currentSale.enabled,
      //   endTime: currentSale.endTime,
      //   maxMintInSale: currentSale.maxMintInSale,
      //   maxMintPerWallet: currentSale.maxMintPerWallet,
      //   mintCharge: currentSale.mintCharge,
      //   saleType: currentSale.saleType as "public" | "private",
      //   startTime: currentSale.startTime,
      //   uuid: currentSale.saleIdentifier,
      //   whitelistAddresses: currentSale.whitelist,
      //   tokenGatedAddress: currentSale.tokenGatedAddress,
      // });

      const mintData = await toast.promise(
        service
          .post("/prepare-mint", {
            projectId: project.id,
            walletAddress: account,
            mintCount,
          })
          .then(
            (res) =>
              res.data.data as {
                config: ISaleConfigSol;
                message: string;
                signature: string;
                whitelistProof: string[];
                mintChargeInWei: string;
                whitelistMintLimit: number;
                saleConfigProof: string[];
              }
          )
          .catch(() => null),
        {
          error: null,
          loading: "Preparing Mint...",
          success: null,
        },
        {
          success: { style: { display: "none" } },
          error: { style: { display: "none" } },
        }
      );

      if (!mintData) throw "Error preparing mint";

      const {
        config,
        message,
        mintChargeInWei,
        signature,
        whitelistProof,
        whitelistMintLimit,
        saleConfigProof,
      } = mintData;

      const tx = await toast.promise(
        contract.mint(
          {
            saleConfigProof,
            whitelistProof,
            numberOfMint: mintCount,
            message,
            signature,
            config,
            whitelistMintLimit,
          },
          {
            value: mintChargeInWei,
          }
        ),
        {
          error: "Error sending transaction",
          loading: "Sending transaction...",
          success: "Transaction Sent",
        }
      );

      await toast.promise(tx.wait(), {
        error: "Error completing transaction",
        loading: "Mining... (Do not close this window)",
        success: "Transaction Completed",
      });

      await service.post(`discord/refresh-role-integrations`, {
        walletAddress: account,
        projectAddress: project.address,
      });
      router.reload();
      return;

      // if (project.collectionType === "1155") {
      //   await service.post(`discord/refresh-role-integrations`, {
      //     walletAddress: account,
      //     projectAddress: project.address,
      //   });
      //   router.reload();
      //   return;
      // }

      // console.log(
      //   get721MintEventArgsMapping(
      //     (receipt as any).events.find((e: any) => e.event === "Mint").args
      //   )
      // );
      // const eventData = get721MintEventArgsMapping(
      //   (receipt as any).events.find((e: any) => e.event === "Mint").args
      // );
      // await toast.promise(
      //   Promise.all([
      //     service.post(`nft/random-unclaimed/attatch`, {
      //       projectId: project.id,
      //       fromTokenId: eventData.fromTokenId,
      //       toTokenId: eventData.toTokenId,
      //     }),
      //     service.post(`discord/refresh-role-integrations`, {
      //       walletAddress: account,
      //       projectAddress: project.address,
      //     }),
      //   ]),
      //   {
      //     error: "Error updating NFT",
      //     loading: "Updating informations...(Page will refresh automatically)",
      //     success: "Mint Successful",
      //   }
      // );
      // router.reload();
    } catch (error) {
      setMintBgProc((v) => v - 1);
      console.log("Minting error : ", error);
      const contractError = getParsedEthersError(error as any).context;
      if (!!contractError && typeof contractError === "string")
        toast.error(contractError);
      else if (typeof error === "string") toast.error(error);
      else toast.error("Error minting");
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
          {!project.bannerUrl && <div className="h-full w-full bg-gray-600" />}
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
            <div className="h-full w-full bg-gray-700 border-2 border-gray-500 rounded" />
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
          <div className="mx-auto max-w-md border-2 border-gray-600 bg-gray-700 rounded-xl p-4 mt-10">
            <div className="divide-y-2 divide-gray-600 space-y-2">
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
                  onClick={() => {
                    if (!!(window as any).ethereum) {
                      activateBrowserWallet();
                    } else {
                      activate(walletConnectConnector)
                        .then(console.log)
                        .catch(console.error);
                    }
                  }}
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
                    <h1>{config.claimedSupply}</h1>
                  </div>
                  {totalSupply !== null && config.claimedSupply !== null && (
                    <div className="flex justify-between items-center">
                      <h1>Unclaimed</h1>
                      <h1>{totalSupply - config.claimedSupply}</h1>
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
              {/* {!!currentSale && !!account && currentSale.saleType !== "public" && (
                <div className="flex justify-between items-center">
                  <h1>
                    Mint Limit for {shortenIfAddress(account)} in this sale
                  </h1>
                  <h1>
                    {currentSale.whitelist.find((wl) => wl.address === account)
                      ?.limit || 0}
                  </h1>
                </div>
              )} */}
            </div>
            <div className="flex flex-col justify-between items-center border-2 border-gray-600 rounded p-1 m-1">
              <h1>Sale Status</h1>
              <h1 className="text-center text-lg">
                {!!currentSale
                  ? normalizeString(currentSale.saleType)
                  : !!nextSale
                  ? `${normalizeString(
                      nextSale.saleType
                    )} Sale starts at ${new Date(
                      nextSale.startTime * 1000
                    ).toLocaleString()} ${
                      new Date(nextSale.startTime * 1000)
                        .toString()
                        .match(/\(([^\)]+)\)$/)?.[1]
                    }`
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
                <input
                  type="number"
                  className="w-20 text-center text-2xl bg-transparent border-2 border-gray-300 rounded"
                  value={mintCount || ""}
                  onChange={(e) =>
                    setMintCount(
                      isNaN(e.target.valueAsNumber)
                        ? 0
                        : Math.max(1, +e.target.valueAsNumber.toFixed(0))
                    )
                  }
                />
                <button
                  className="border-2 border-gray-400 rounded-full w-8 h-8 flex justify-center items-center hover:bg-gray-400 hover:text-black transition-colors disabled:cursor-not-allowed"
                  onClick={() => setMintCount((v) => v + 1)}
                  disabled={mintBgProc > 0}
                >
                  +
                </button>
              </div>
            </div>
            <button
              className="bg-teal-700 font-medium text-4xl text-white rounded hover:bg-teal-600 transition-colors w-full py-4 disabled:bg-teal-400 disabled:text-gray-500 disabled:cursor-not-allowed"
              onClick={handleMintClick}
              disabled={mintBgProc > 0}
            >
              {!account ? "Wallet Not Connected" : "Mint "}
              {!!currentSale && !!account && (
                <span className="text-lg">
                  {mintCount < 1 ? (
                    <>Invalid</>
                  ) : (
                    <>
                      {+(currentSale.mintCharge * mintCount).toFixed(8) ===
                      0 ? (
                        "(Free)"
                      ) : (
                        <>
                          (
                          {
                            +multiply(
                              currentSale.mintCharge,
                              mintCount
                            ).toFixed(8)
                          }{" "}
                          ETH)
                        </>
                      )}
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
  console.log(1);

  const { uid } = context.query;
  if (!uid || typeof uid !== "string")
    return { props: {}, redirect: { destination: "/404" } };
  const project = await getIfCached({
    key: `project-by-uid:${uid}`,
    ttl: 300,
    realtimeDataCb: () => getProjectByUid(uid).catch((_err) => null),
  });
  if (!project || !project.address || !project.chainId)
    return { props: {}, redirect: { destination: "/404" } };
  console.log(2);
  // fixMissingTokenIds(project.id);

  const [currentSale, totalSupply] = await Promise.all([
    getIfCached({
      key: `basic-current-sale:${project.id}`,
      ttl: 30,
      realtimeDataCb: () =>
        getBasicCurrentSale(project.id).catch((err) => {
          console.log("Error getting current sale", err);
          return null;
        }),
    }),
    getIfCached({
      key: `totalSupplyCount:${project.chainId}:${project.address}`,
      ttl: 30,
      realtimeDataCb: () =>
        getTotalSupplyCountByProjectChainAddress(
          project.address!,
          project.chainId!
        ).catch((err) => {
          console.log("Error getting Total Supply Count : ", err);
          return null;
        }),
    }),
    // getNextSale(project.id).catch((_err) => {
    //   // console.log("Error getting next sale", err);
    //   return null;
    // }),
    // getClaimedSupplyCountByProjectChainAddress(
    //   project.address,
    //   project.chainId
    // ).catch((err) => {
    //   console.log("Error getting Claimed Supply Count : ", err);
    //   return 0;
    // }),
    // getCurrentAndNextSale(project.id).catch((err) => {
    //   console.log("Error getting sales", err);
    //   return { currentSale: null, nextSale: null };
    // }),
    // getRandomMessageSignature().catch((err) => {
    //   console.log("Error getting random msg/sign : ", err);
    //   return null;
    // }),
    ,
  ]);
  console.log(3);
  // const configProof = !!currentSale
  //   ? await getSaleConfigProofByProjectId(
  //       project.id,
  //       currentSale.saleIdentifier
  //     ).catch((err) => {
  //       console.log("Error getting config proof", err);
  //       return null;
  //     })
  //   : null;
  // console.log(4);
  // if (currentSale?.tokenGatedAddress)
  //   fetchAndStoreEvents(project.id, currentSale?.tokenGatedAddress!);

  return {
    props: {
      project,
      currentSale,
      nextSale: null,
      // configProof,
      totalSupply,
      // claimedSupply,
      // randomMsgSign,
    },
  };
};

export default MintPage;
