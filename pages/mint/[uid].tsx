import { useEthers } from "@usedapp/core";
import { Contract, getDefaultProvider } from "ethers";
import { isAddress } from "ethers/lib/utils";
import { GetServerSideProps, NextPage } from "next";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
import toast, { LoaderIcon } from "react-hot-toast";
import { ABI1155, ABI721 } from "../../constants/abis";
import { RPC_URLS } from "../../constants/RPC_URL";
import { getTokenUri } from "../../constants/tokenUri";
import { service } from "../../service";
import { getProjectByUid } from "../../services/project.service";
import { MintPageConfig, ProjectExtended } from "../../types";
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
  const [userTokenBalance, setUserTokenBalance] = useState(0);
  const [saleConfigBgProc, setSaleConfigBgProc] = useState(0);
  const [configSet, setConfigSet] = useState<MintPageConfig>({
    maxMintInPrivate: 0,
    maxMintInPublic: 0,
    privateMintCharge: 0,
    privateSaleConfig1: null,
    privateSaleConfig2: null,
    publicMintCharge: 0,
    publicSaleConfig: null,
  });
  useEffect(() => {
    (async () => {
      if (
        !account ||
        !isAddress(account) ||
        !project.address ||
        !project.chainId ||
        !RPC_URLS[project.chainId]
      )
        return;
      try {
        setSaleConfigBgProc((v) => v + 1);
        const contract = new Contract(
          project.address,
          project.collectionType === "721" ? ABI721 : ABI1155,
          getDefaultProvider(RPC_URLS[project.chainId])
        );
        const balance = await contract.balanceOf(account);
        setUserTokenBalance(balance.toString());
        setSaleConfigBgProc((v) => v - 1);
      } catch (error) {
        setSaleConfigBgProc((v) => v - 1);
        console.log("Error fetching user balance : ", error);
      }
    })();
  }, [account, project.address, project.chainId, project.collectionType]);
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
          privateSaleConfig1,
          privateSaleConfig2,
          publicSaleConfig,
          privateMintCharge,
          publicMintCharge,
          maxMintInPrivate,
          maxMintInPublic,
        ] = await Promise.all([
          contract.privateSale1(),
          contract.privateSale2(),
          contract.publicSale(),
          contract.privateMintCharge(),
          contract.publicMintCharge(),
          contract.maxMintInPrivate(),
          contract.maxMintInPublic(),
        ]);

        setConfigSet((old) => ({
          ...old,
          maxMintInPrivate: +maxMintInPrivate.toString(),
          maxMintInPublic: +maxMintInPublic.toString(),
          privateMintCharge: +privateMintCharge.toString(),
          publicMintCharge: +publicMintCharge.toString(),
          privateSaleConfig1: getSaleConfigFromResponse(privateSaleConfig1),
          privateSaleConfig2: getSaleConfigFromResponse(privateSaleConfig2),
          publicSaleConfig: getSaleConfigFromResponse(publicSaleConfig),
        }));
        setSaleConfigBgProc((v) => v - 1);
      } catch (error) {
        setSaleConfigBgProc((v) => v - 1);
        console.log("Error fetching sales : ", error);
      }
    })();
  }, [project.address, project.chainId, project.collectionType]);

  const isPrivateSale1Valid = useMemo(() => {
    if (!configSet.privateSaleConfig1) return false;
    const now = +(Date.now() / 1000).toFixed(0);
    return (
      configSet.privateSaleConfig1.status &&
      configSet.privateSaleConfig1.startTime < now &&
      (configSet.privateSaleConfig1.endTime === 0 ||
        configSet.privateSaleConfig1.endTime > now)
    );
  }, [configSet.privateSaleConfig1]);

  const isPrivateSale2Valid = useMemo(() => {
    if (!configSet.privateSaleConfig2) return false;
    const now = +(Date.now() / 1000).toFixed(0);
    return (
      configSet.privateSaleConfig2.status &&
      configSet.privateSaleConfig2.startTime < now &&
      (configSet.privateSaleConfig2.endTime === 0 ||
        configSet.privateSaleConfig2.endTime > now)
    );
  }, [configSet.privateSaleConfig2]);

  const isPublicSaleValid = useMemo(() => {
    if (!configSet.publicSaleConfig) return false;
    const now = +(Date.now() / 1000).toFixed(0);
    return (
      configSet.publicSaleConfig.status &&
      configSet.publicSaleConfig.startTime < now &&
      (configSet.publicSaleConfig.endTime === 0 ||
        configSet.publicSaleConfig.endTime > now)
    );
  }, [configSet.publicSaleConfig]);

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
          value: configSet.publicMintCharge.toString(),
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
          { value: configSet.privateMintCharge.toString() }
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

  const isPrivateMintButtonDisabled = useMemo(
    () =>
      !account
        ? false
        : (account && !project.whitelist.includes(account)) ||
          userTokenBalance >= configSet.maxMintInPrivate ||
          project.nfts.filter((n) => n.tokenId === null).length === 0,
    [
      account,
      configSet.maxMintInPrivate,
      project.nfts,
      project.whitelist,
      userTokenBalance,
    ]
  );

  const isPublicMintButtonDisabled = useMemo(
    () =>
      !account
        ? false
        : userTokenBalance >= configSet.maxMintInPrivate ||
          project.nfts.filter((n) => n.tokenId === null).length === 0,
    [account, configSet.maxMintInPrivate, project.nfts, userTokenBalance]
  );

  const privateMintButtonText = useMemo(() => {
    if (!account) return `Please connect wallet`;
    if (!project.whitelist.includes(account)) return `You are not whitelisted`;
    if (userTokenBalance >= configSet.maxMintInPrivate)
      return `Max Limit Reached`;
    if (project.nfts.filter((n) => n.tokenId === null).length === 0)
      return `Mint Sold Out`;
    return `Mint`;
  }, [
    account,
    configSet.maxMintInPrivate,
    project.nfts,
    project.whitelist,
    userTokenBalance,
  ]);

  const publicMintButtonText = useMemo(() => {
    if (!account) return `Please connect wallet`;
    if (userTokenBalance >= configSet.maxMintInPrivate)
      return `Max Limit Reached`;
    if (project.nfts.filter((n) => n.tokenId === null).length === 0)
      return `Mint Sold Out`;
    return `Mint`;
  }, [account, configSet.maxMintInPrivate, project.nfts, userTokenBalance]);

  const privateSale1NextDate = useMemo(
    () =>
      configSet.privateSaleConfig1 &&
      configSet.privateSaleConfig1.status &&
      configSet.privateSaleConfig1.startTime >
        +(Date.now() / 1000).toFixed(2) &&
      `Private Sale 1 Starts at ${new Date(
        configSet.privateSaleConfig1.startTime * 1000
      ).toLocaleString()}`,
    [configSet.privateSaleConfig1]
  );

  const privateSale2NextDate = useMemo(
    () =>
      configSet.privateSaleConfig2 &&
      configSet.privateSaleConfig2.status &&
      configSet.privateSaleConfig2.startTime >
        +(Date.now() / 1000).toFixed(2) &&
      `Private Sale 2 Starts at ${new Date(
        configSet.privateSaleConfig2.startTime * 1000
      ).toLocaleString()}`,
    [configSet.privateSaleConfig2]
  );

  const publicSaleNextDate = useMemo(
    () =>
      configSet.publicSaleConfig &&
      configSet.publicSaleConfig.status &&
      configSet.publicSaleConfig.startTime > +(Date.now() / 1000).toFixed(2) &&
      `Private Sale 2 Starts at ${new Date(
        configSet.publicSaleConfig.startTime * 1000
      ).toLocaleString()}`,
    [configSet.publicSaleConfig]
  );

  const Card = {
    public: () => (
      <>
        {isPublicSaleValid ? (
          <button
            className="bg-blue-500 text-white p-2 hover:bg-blue-600 transition-colors w-full rounded-3xl disabled:bg-blue-400 disabled:text-gray-500"
            disabled={isPublicMintButtonDisabled}
            onClick={account ? handleRandomPublicMint : activateBrowserWallet}
          >
            {publicMintButtonText}
          </button>
        ) : (
          <>
            <h1>Public Sell is not currently running</h1>
            <h2>Please check back later</h2>
            <h2>{publicSaleNextDate}</h2>
          </>
        )}
      </>
    ),
    private: () => (
      <>
        {isPrivateSale1Valid || isPrivateSale2Valid ? (
          <button
            className="bg-blue-500 text-white p-2 hover:bg-blue-600 transition-colors w-full rounded-3xl disabled:bg-blue-400 disabled:text-gray-500"
            disabled={isPrivateMintButtonDisabled}
            onClick={account ? handleRandomPrivateMint : activateBrowserWallet}
          >
            {privateMintButtonText}
          </button>
        ) : (
          <>
            <h1>Private Sell is not currently running</h1>
            <h2>Please check back later</h2>
            <h2>{privateSale1NextDate}</h2>
            <h2>{privateSale2NextDate}</h2>
          </>
        )}
      </>
    ),
  };

  const LinkButton = ({
    text,
    selected = false,
  }: {
    text: string;
    selected?: boolean;
  }) => (
    <button
      className={`${
        selected ? "bg-blue-700 font-bold" : "bg-blue-500 font-medium"
      } text-white p-2 w-36 hover:bg-blue-700 transition-colors`}
      onClick={() =>
        router.push({
          ...router,
          query: { ...router.query, type: text.toLowerCase() },
        })
      }
    >
      {text}
    </button>
  );

  const Button = {
    private: () => <LinkButton text="Private" selected={type === "private"} />,
    public: () => <LinkButton text="Public" selected={type === "public"} />,
  };

  return (
    <div>
      <div className="flex justify-end">
        <div className="flex rounded-3xl overflow-hidden">
          <Button.private />
          <Button.public />
        </div>
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
            {type === "private" && <Card.private />}
            {type === "public" && <Card.public />}
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
  return { props: { project, type: type === "public" ? type : "private" } };
};

export default MintPage;
