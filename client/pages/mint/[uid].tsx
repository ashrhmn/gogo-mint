import { Project } from "@prisma/client";
import { useEthers } from "@usedapp/core";
import { Contract, getDefaultProvider } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { GetServerSideProps, NextPage } from "next";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
import toast, { LoaderIcon } from "react-hot-toast";
import { ABI1155, ABI721 } from "../../constants/abis";
import { RPC_URLS } from "../../constants/RPC_URL";
import { getTokenUri } from "../../constants/tokenUri";
import { service } from "../../service";
import { getProjectByUid } from "../../services/project.service";
import { ISaleConfig, ProjectExtended } from "../../types";
import { randomIntFromInterval } from "../../utils/Number.utils";
import {
  getMintEventArgsMapping,
  getSaleConfigFromResponse,
} from "../../utils/String.utils";

interface Props {
  project: ProjectExtended;
  type: "public" | "private";
}

const MintPage: NextPage<Props> = ({ project, type }) => {
  const router = useRouter();
  const { account, library, chainId, activateBrowserWallet } = useEthers();
  const [privateMintCharge, setPrivateMintCharge] = useState(0);
  const [publicMintCharge, setPublicMintCharge] = useState(0);
  const [privateSale1Config, setPrivateSale1Config] =
    useState<ISaleConfig | null>(null);
  const [privateSale2Config, setPrivateSale2Config] =
    useState<ISaleConfig | null>(null);
  const [publicSaleConfig, setPublicSaleConfig] = useState<ISaleConfig | null>(
    null
  );
  const [saleConfigBgProc, setSaleConfigBgProc] = useState(0);
  useEffect(() => {
    (async () => {
      try {
        if (!project.address || !project.chainId || !RPC_URLS[project.chainId])
          return;
        setSaleConfigBgProc((v) => v + 1);
        const contract = new Contract(
          project.address,
          project.collectionType === "721" ? ABI721 : ABI1155,
          getDefaultProvider(RPC_URLS[project.chainId])
        );
        const [
          privateSale1,
          privateSale2,
          publicSale,
          privateMintCharge,
          publicMintCharge,
        ] = await Promise.all([
          contract.privateSale1(),
          contract.privateSale2(),
          contract.publicSale(),
          contract.privateMintCharge(),
          contract.publicMintCharge(),
        ]);
        setPrivateMintCharge(privateMintCharge.toString());
        setPublicMintCharge(publicMintCharge.toString());
        setPrivateSale1Config(getSaleConfigFromResponse(privateSale1));
        setPrivateSale2Config(getSaleConfigFromResponse(privateSale2));
        setPublicSaleConfig(getSaleConfigFromResponse(publicSale));
        setSaleConfigBgProc((v) => v - 1);
      } catch (error) {
        setSaleConfigBgProc((v) => v - 1);
        console.log("Error fetching sales : ", error);
      }
    })();
  }, [project.address, project.chainId, project.collectionType]);

  const isPrivateSale1Valid = useMemo(() => {
    if (!privateSale1Config) return false;
    const now = +(Date.now() / 1000).toFixed(0);
    return (
      privateSale1Config.status &&
      privateSale1Config.startTime < now &&
      (privateSale1Config.endTime === 0 || privateSale1Config.endTime > now)
    );
  }, [privateSale1Config]);

  const isPrivateSale2Valid = useMemo(() => {
    if (!privateSale2Config) return false;
    const now = +(Date.now() / 1000).toFixed(0);
    return (
      privateSale2Config.status &&
      privateSale2Config.startTime < now &&
      (privateSale2Config.endTime === 0 || privateSale2Config.endTime > now)
    );
  }, [privateSale2Config]);

  const isPublicSaleValid = useMemo(() => {
    if (!publicSaleConfig) return false;
    const now = +(Date.now() / 1000).toFixed(0);
    return (
      publicSaleConfig.status &&
      publicSaleConfig.startTime < now &&
      (publicSaleConfig.endTime === 0 || publicSaleConfig.endTime > now)
    );
  }, [publicSaleConfig]);

  const handleRandomPublicMint = async () => {
    try {
      if (!project.address || !project.chainId || !RPC_URLS[project.chainId]) {
        toast.error("Error loading project");
        return;
      }
      if (!account || !library || !chainId) {
        toast.error("Please connect your wallet");
        return;
      }

      if (chainId !== project.chainId) {
        toast.error(`Please switch to network id ${project.chainId}`);
        return;
      }

      const unmintedNfts = project.nfts.filter((n) => n.tokenId === null);
      const randomNft =
        unmintedNfts[randomIntFromInterval(0, unmintedNfts.length - 1)];
      const contract = new Contract(
        project.address,
        project.collectionType == "721" ? ABI721 : ABI1155,
        library.getSigner(account)
      );

      const tx = await toast.promise(
        contract.mint(getTokenUri(randomNft.id), randomNft.signature, {
          value: publicMintCharge.toString(),
        }),
        {
          error: "Error sending transaction",
          loading: "Sending transaction...",
          success: "Transaction sent",
        }
      );
      const receipt = await toast.promise((tx as any).wait(), {
        error: "Mining failed",
        loading: "Mining transaction...",
        success: "Transaction Completed",
      });
      const mintEventArgs = getMintEventArgsMapping(
        (receipt as any).events.find((e: any) => e.event === "Mint").args
      );

      const { data: nft } = await toast.promise(
        service.put(`/nft/tokenId`, {
          id: randomNft.id,
          tokenId: mintEventArgs.tokenId,
        }),
        {
          error: "Updating NFT Information failed",
          loading: "Updating NFT Information",
          success: "NFT Information updated",
        }
      );
      if (nft.error) throw nft.error;
      router.reload();
    } catch (error) {
      console.log("Error Private Minting : ", error);
    }
  };
  const handleRandomPrivateMint = async () => {
    try {
      if (!project.address || !project.chainId || !RPC_URLS[project.chainId]) {
        toast.error("Error loading project");
        return;
      }
      if (!account || !library || !chainId) {
        toast.error("Please connect your wallet");
        return;
      }

      if (chainId !== project.chainId) {
        toast.error(`Please switch to network id ${project.chainId}`);
        return;
      }

      const { data: proof } = await toast.promise(
        service.get(`/projects/proof?id=${project.id}&address=${account}`),
        {
          error: "Error generating proof",
          loading: "Generating verification proof",
          success: "Proof generated successfully",
        }
      );

      if (proof.error) throw proof.error;

      const unmintedNfts = project.nfts.filter((n) => n.tokenId === null);
      const randomNft =
        unmintedNfts[randomIntFromInterval(0, unmintedNfts.length - 1)];
      const contract = new Contract(
        project.address,
        project.collectionType == "721" ? ABI721 : ABI1155,
        library.getSigner(account)
      );

      const tx = await toast.promise(
        contract.mintPrivate(
          getTokenUri(randomNft.id),
          proof.data,
          randomNft.signature,
          { value: privateMintCharge.toString() }
        ),
        {
          error: "Error sending transaction",
          loading: "Sending transaction...",
          success: "Transaction sent",
        }
      );
      const receipt = await toast.promise((tx as any).wait(), {
        error: "Mining failed",
        loading: "Mining transaction...",
        success: "Transaction Completed",
      });
      const mintEventArgs = getMintEventArgsMapping(
        (receipt as any).events.find((e: any) => e.event === "Mint").args
      );

      const { data: nft } = await toast.promise(
        service.put(`/nft/tokenId`, {
          id: randomNft.id,
          tokenId: mintEventArgs.tokenId,
        }),
        {
          error: "Updating NFT Information failed",
          loading: "Updating NFT Information",
          success: "NFT Information updated",
        }
      );
      if (nft.error) throw nft.error;
      router.reload();
    } catch (error) {
      console.log("Error Private Minting : ", error);
    }
  };
  return (
    <div>
      <div className="flex justify-end">
        <button
          className={`${
            type === "private"
              ? "bg-blue-700 font-bold"
              : "bg-blue-500 font-medium"
          } text-white p-2 w-36 hover:bg-blue-700 rounded-l-3xl transition-colors`}
          onClick={() =>
            router.push({
              ...router,
              query: { ...router.query, type: "private" },
            })
          }
        >
          Private
        </button>
        <button
          className={`${
            type === "public"
              ? "bg-blue-700 font-bold"
              : "bg-blue-500 font-medium"
          } text-white p-2 w-36 hover:bg-blue-700 rounded-r-3xl transition-colors`}
          onClick={() =>
            router.push({
              ...router,
              query: { ...router.query, type: "public" },
            })
          }
        >
          Public
        </button>
      </div>
      <div className="bg-gray-200 rounded p-4 my-4 text-2xl max-w-sm">
        <div className="my-4 font-medium">
          <h1>Total Supply : {project.nfts.length}</h1>
          <h1>
            Already Claimed :{" "}
            {project.nfts.filter((n) => n.tokenId !== null).length}
          </h1>
          <h1>
            Unclaimed : {project.nfts.filter((n) => n.tokenId === null).length}
          </h1>
        </div>
        {!!saleConfigBgProc ? (
          <div className="flex justify-center scale-150">
            <LoaderIcon />
          </div>
        ) : (
          <>
            {type === "private" && (
              <>
                {isPrivateSale1Valid || isPrivateSale2Valid ? (
                  <>
                    {!account ? (
                      <button onClick={activateBrowserWallet}>
                        Please Connect your wallet
                      </button>
                    ) : (
                      <>
                        {project.whitelist.includes(account) ? (
                          <>
                            <button
                              className="bg-blue-500 text-white p-2 hover:bg-blue-600 transition-colors w-full rounded-3xl disabled:bg-blue-400 disabled:text-gray-500"
                              onClick={handleRandomPrivateMint}
                              disabled={
                                project.nfts.filter((n) => n.tokenId === null)
                                  .length === 0
                              }
                            >
                              {project.nfts.filter((n) => n.tokenId === null)
                                .length > 0
                                ? "Mint"
                                : "Mint Sold Out"}
                            </button>
                          </>
                        ) : (
                          <>
                            <h1>You are not whitelisted</h1>
                          </>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <h1>Private Sell is not currently running</h1>
                    <h2>Please check back later</h2>
                    {privateSale1Config &&
                      privateSale1Config.status &&
                      privateSale1Config.startTime >
                        +(Date.now() / 1000).toFixed(2) && (
                        <h2>
                          Private Sale 1 starts at{" "}
                          <span>
                            {new Date(
                              privateSale1Config.startTime * 1000
                            ).toLocaleString()}
                          </span>
                        </h2>
                      )}
                    {privateSale2Config &&
                      privateSale2Config.status &&
                      privateSale2Config.startTime >
                        +(Date.now() / 1000).toFixed(2) && (
                        <h2>
                          Private Sale 2 starts at{" "}
                          <span>
                            {new Date(
                              privateSale2Config.startTime * 1000
                            ).toLocaleString()}
                          </span>
                        </h2>
                      )}
                  </>
                )}
              </>
            )}
            {type === "public" && (
              <>
                {isPublicSaleValid ? (
                  <>
                    {!account ? (
                      <button onClick={activateBrowserWallet}>
                        Please Connect your wallet
                      </button>
                    ) : (
                      <button
                        className="bg-blue-500 text-white p-2 hover:bg-blue-600 transition-colors w-full rounded-3xl disabled:bg-blue-400 disabled:text-gray-500"
                        onClick={handleRandomPublicMint}
                        disabled={
                          project.nfts.filter((n) => n.tokenId === null)
                            .length === 0
                        }
                      >
                        {project.nfts.filter((n) => n.tokenId === null).length >
                        0
                          ? "Mint"
                          : "Mint Sold Out"}
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <h1>Public Sell is not currently running</h1>
                    <h2>Please check back later</h2>
                    {publicSaleConfig &&
                      publicSaleConfig.status &&
                      publicSaleConfig.startTime >
                        +(Date.now() / 1000).toFixed(2) && (
                        <h2>
                          Public Sale starts at{" "}
                          <span>
                            {new Date(
                              publicSaleConfig.startTime * 1000
                            ).toLocaleString()}
                          </span>
                        </h2>
                      )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { uid, type } = context.query;
  if (!uid || typeof uid !== "string")
    return { props: {}, redirect: { destination: "/404" } };
  const project = await getProjectByUid(uid);
  if (!project) return { props: {}, redirect: { destination: "/404" } };
  //   console.log("Project : ", project);

  return { props: { project, type: type === "public" ? type : "private" } };
};

export default MintPage;
