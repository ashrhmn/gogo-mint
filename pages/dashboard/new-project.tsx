import { shortenIfAddress, useEthers } from "@usedapp/core";
import { BigNumber, Contract, ethers, providers } from "ethers";
import { isAddress, parseEther } from "ethers/lib/utils";
import { GetServerSideProps, NextPage } from "next";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { v4 } from "uuid";
import Layout from "../../components/Layout";
import SaleConfigInput from "../../components/Projects/SaleConfigInput";
import { aggregatorV3InterfaceABI } from "../../constants/abis";
import { PRICE_FEED_ADDRESSES } from "../../constants/chainlink.map";
import { BASE_URI, ZERO_ADDRESS } from "../../constants/configuration";
import { RPC_URLS } from "../../constants/RPC_URL";
import {
  Collection1155__factory,
  Collection721__factory,
} from "../../ContractFactory";
import { uploadFileToFirebase } from "../../lib/firebase";
import { service } from "../../service";
import { getCookieWallet } from "../../services/auth.service";
import { is721 } from "../../services/ethereum.service";
import { getUserByWalletAddress } from "../../services/user.service";
import { IDeployConfigSet, ISaleConfigInput } from "../../types";
import { errorHasMessage } from "../../utils/Error.utils";
import { getHttpCookie } from "../../utils/Request.utils";
import { authPageUrlWithMessage } from "../../utils/Response.utils";
import { formatHtmlDateTime, normalizeString } from "../../utils/String.utils";

interface Props {
  cookieAddress: string;
  baseUri: string;
}

const NewProject: NextPage<Props> = ({ cookieAddress, baseUri }) => {
  const { account, library, chainId } = useEthers();
  const imgInputRef = useRef<HTMLInputElement | null>(null);
  const unrevealedImgInputRef = useRef<HTMLInputElement | null>(null);
  const [bgProcessRunning, setBgProcessRunning] = useState(0);
  const router = useRouter();
  const [configSet, setConfigSet] = useState<IDeployConfigSet>({
    name: "",
    description: "",
    feeToAddress: "",
    logo: null,
    unrevealedImage: null,
    banner: null,
    symbol: "",
    saleWaves: [],
    uid: "",
    roayltyPercentage: 10,
    roayltyReceiver: "",
    maxMintInTotalPerWallet: 0,
    collectionType: "721",
    revealTime: +(+Date.now() / 1000).toFixed(0),
    maxLimitCap: 1000,
  });

  useEffect(() => {
    if (account)
      setConfigSet((c) => ({
        ...c,
        feeToAddress: account,
        roayltyReceiver: account,
      }));
    if (account && account !== cookieAddress)
      router.push(
        authPageUrlWithMessage(
          `Signed in wallet is ${shortenIfAddress(
            cookieAddress
          )}, but connected wallet is ${shortenIfAddress(
            account
          )}. Please Sign with current wallet`
        )
      );
  }, [account, cookieAddress, router]);
  const [imageBase64, setImageBase64] = useState("");
  const [unrevealedImageBase64, setUnrevealedImageBase64] = useState("");
  const onSelectImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", (ev) => {
      if (ev.target && typeof ev.target.result === "string")
        setImageBase64(ev.target.result);
    });
    reader.readAsDataURL(file);
    setConfigSet((c) => ({ ...c, logo: file }));
  };
  const onSelectUnrevealedImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", (ev) => {
      if (ev.target && typeof ev.target.result === "string")
        setUnrevealedImageBase64(ev.target.result);
    });
    reader.readAsDataURL(file);
    setConfigSet((c) => ({ ...c, unrevealedImage: file }));
  };

  const deploy721 = async (
    name: string,
    symbol: string,
    feeToAddress: string,
    maxMintInTotalPerWallet: number,
    saleConfigRoot: string,
    platformSignerAddress: string,
    baseURI: string,
    revealTime: number,
    deployCharge: BigNumber,
    royaltyBasis: number,
    maxMintCap: number,
    factory: Collection721__factory,
    debugParams?: boolean
  ) => {
    const param = {
      _baseURI: baseURI,
      _feeDestination: feeToAddress,
      _maxMintCap: maxMintCap,
      _maxMintInTotalPerWallet: maxMintInTotalPerWallet,
      _msgSigner: platformSignerAddress,
      _name: name,
      _platformOwner:
        process.env.NEXT_PUBLIC_PLATFORM_OWNER ||
        "0x4A7D933678676fa5F1d8dE3B6A0bBa9460fC1BdE",
      _priceFeedAddress: PRICE_FEED_ADDRESSES[chainId || 0] || ZERO_ADDRESS,
      _revealTime: revealTime,
      _royaltyBasis: royaltyBasis,
      _saleConfigRoot: saleConfigRoot,
      _symbol: symbol,
    };
    if (debugParams) alert(JSON.stringify(param));
    const contract = await toast.promise(
      factory.deploy(param, {
        value: deployCharge.mul(maxMintCap),
      }),
      {
        success: "Transaction sent",
        error: "Error sending transaction",
        loading: "Sending transaction...",
      }
    );
    return contract;
  };

  const deploy1155 = async (
    name: string,
    feeToAddress: string,
    maxMintInTotalPerWallet: number,
    saleConfigRoot: string,
    platformSignerAddress: string,
    baseURI: string,
    revealTime: number,
    deployCharge: BigNumber,
    royaltyBasis: number,
    maxMintCap: number,
    factory: Collection1155__factory,
    debugParams?: boolean
  ) => {
    const param = {
      _baseURI: baseURI,
      _feeDestination: feeToAddress,
      _maxMintCap: maxMintCap,
      _maxMintInTotalPerWallet: maxMintInTotalPerWallet,
      _msgSigner: platformSignerAddress,
      _name: name,
      _platformOwner:
        process.env.NEXT_PUBLIC_PLATFORM_OWNER ||
        "0x4A7D933678676fa5F1d8dE3B6A0bBa9460fC1BdE",
      _priceFeedAddress: PRICE_FEED_ADDRESSES[chainId || 0] || ZERO_ADDRESS,
      _revealTime: revealTime,
      _royaltyBasis: royaltyBasis,
      _saleConfigRoot: saleConfigRoot,
    };
    if (debugParams) alert(JSON.stringify(param));
    const contract = await toast.promise(
      factory.deploy(param, {
        value: deployCharge.mul(maxMintCap),
      }),
      {
        success: "Transaction sent",
        error: "Error sending transaction",
        loading: "Sending transaction...",
      }
    );
    return contract;
  };

  const onDeployClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log({ configSet });

    if (!library || !chainId) {
      toast.error("No signer connected");
      return;
    }

    if (!account) {
      toast.error("Please connect to a wallet");
      return;
    }
    if (!configSet.name) {
      toast.error("Name is required");
      return;
    }
    if (!/[a-zA-Z -]+/g.test(configSet.name)) {
      toast.error("Invalid Name");
      return;
    }
    if (!/[a-zA-Z -]+/g.test(configSet.symbol)) {
      toast.error("Invalid Symbol");
      return;
    }
    if (!configSet.feeToAddress) {
      toast.error("Please enter a fee recipient address");
      return;
    }
    if (!isAddress(configSet.feeToAddress)) {
      toast.error("Invalid fee recipient address");
      return;
    }
    if (
      configSet.roayltyReceiver !== "" &&
      !isAddress(configSet.roayltyReceiver)
    ) {
      toast.error("Invalid royalty receiver address");
      return;
    }

    if (!configSet.symbol) {
      toast.error("Symbol is required");
      return;
    }
    setBgProcessRunning((v) => v + 1);
    try {
      const salewaves: ISaleConfigInput[] = await Promise.all(
        configSet.saleWaves.map(async (sw) =>
          sw.tokenGatedAddress !== ethers.constants.AddressZero &&
          (await is721(sw.tokenGatedAddress, chainId))
            ? { ...sw, maxMintPerWallet: 0, saleType: "private" }
            : { ...sw, tokenGatedAddress: ethers.constants.AddressZero }
        )
      );
      // const config: ISaleConfigInput[] = await Promise.all(
      //   configSet.saleWaves.map(async (sw) => {
      //     if (
      //       sw.tokenGatedAddress !== ethers.constants.AddressZero &&
      //       (await is721(sw.tokenGatedAddress, chainId))
      //     ) {
      //       return { ...sw, maxMintPerWallet: 0, saleType: "private" };
      //     }
      //     return { ...sw, tokenGatedAddress: ethers.constants.AddressZero };
      //   })
      // );
      const [
        imageUrl,
        unrevealedImageUrl,
        { data: saleConfigRoot },
        // { data: initCode },
        { data: platformSignerAddress },
        deployCharge,
      ] = await toast.promise(
        Promise.all([
          uploadFileToFirebase(configSet.logo),
          uploadFileToFirebase(configSet.unrevealedImage),
          service.post(`sale-config/root`, {
            saleConfigs: salewaves.map((sw) => ({
              ...sw,
              whitelistAddresses:
                sw.saleType === "public" ? [] : sw.whitelistAddresses,
            })),
          }),
          // service.get(`contract/collection721?name=${configSet.name}`),
          service.get(`platform-signer/public-address`),
          (async () => {
            const priceFeedAddress = PRICE_FEED_ADDRESSES[chainId || 0];
            const rpcUrl = RPC_URLS[chainId || 0];
            if (!priceFeedAddress || !rpcUrl)
              return BigNumber.from(parseEther("0.00015"));
            try {
              const contract = new Contract(
                priceFeedAddress,
                aggregatorV3InterfaceABI,
                new providers.StaticJsonRpcProvider(rpcUrl)
              );
              const price = (await contract.latestRoundData())
                .answer as BigNumber;
              return BigNumber.from(parseEther("1"))
                .div(price.div(10 ** 8))
                .mul(15)
                .div(100);
            } catch (error) {
              console.log("Error fetching eth price : ", error);
              return BigNumber.from(parseEther("0.00015"));
            }
          })(),
        ]),
        {
          success: "Contract Compiled Successfully",
          error: "Error compiling contract",
          loading: "Compiling contract...",
        }
      );

      if (!isAddress(platformSignerAddress.data)) {
        toast.error("Error getting platform signer");
        setBgProcessRunning((v) => v - 1);
        return;
      }

      if (saleConfigRoot.error) {
        toast.error("Error getting saleconfig root");
        setBgProcessRunning((v) => v - 1);
        return;
      }
      const contract =
        configSet.collectionType === "721"
          ? await deploy721(
              normalizeString(configSet.name),
              normalizeString(configSet.symbol),
              configSet.feeToAddress,
              configSet.maxMintInTotalPerWallet,
              saleConfigRoot.data,
              platformSignerAddress.data,
              baseUri,
              configSet.revealTime,
              deployCharge,
              configSet.roayltyPercentage * 100,
              +configSet.maxLimitCap.toFixed(0),
              new Collection721__factory(library.getSigner(account)),
              !!e.altKey
            )
          : await deploy1155(
              normalizeString(configSet.name),
              configSet.feeToAddress,
              configSet.maxMintInTotalPerWallet,
              saleConfigRoot.data,
              platformSignerAddress.data,
              baseUri,
              configSet.revealTime,
              deployCharge,
              configSet.roayltyPercentage * 100,
              +configSet.maxLimitCap.toFixed(0),
              new Collection1155__factory(library.getSigner(account)),
              !!e.altKey
            );

      const [newProject] = await toast.promise(
        Promise.all([
          service.post(`/projects`, {
            name: configSet.name,
            address: contract.address,
            description: configSet.description,
            imageUrl,
            unrevealedImageUrl,
            chainId,
            collectionType: configSet.collectionType,
            signerAddress: account,
            uid: v4(),
            royaltyReceiver: configSet.roayltyReceiver,
            royaltyPercentage: configSet.roayltyPercentage,
            saleConfigs: salewaves.map((sw) => ({
              ...sw,
              whitelistAddresses:
                sw.saleType === "public" ? [] : sw.whitelistAddresses,
              startTime: +sw.startTime.toFixed(0),
              endTime: +sw.endTime.toFixed(0),
            })),
          }),
          contract.deployed(),
        ]),
        {
          success: "Contract deployed successfully",
          error: "Error deploying contract",
          loading: "Deploying contract...",
        }
      );
      if (newProject.data.error) {
        console.log(newProject.data.error);
        setBgProcessRunning((v) => v - 1);
        toast.error("Error saving project");
        return;
      }
      await service
        .get(`/restart-listeners`)
        .then((res) => res.data)
        .then(console.log)
        .catch(console.error);
      setBgProcessRunning((v) => v - 1);

      router.push(
        `/dashboard/project?contract=${contract.address}&network=${chainId}`
      );
    } catch (error) {
      console.log(error);
      if ((error as any).message) toast.error((error as any).message);
      if (typeof error === "string") toast.error(error);
      setBgProcessRunning((v) => v - 1);
    }
  };

  return (
    <Layout dashboard>
      <div className="text-xl border-2 border-gray-600 rounded-xl p-4">
        <h1 className="text-4xl my-3 font-bold">NFT Drop</h1>
        <h1 className="text-2xl font-medium my-1">Contract Information</h1>
        <h2>Customize your new project</h2>
        <div>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div
              onClick={() => {
                if (imgInputRef && imgInputRef.current)
                  imgInputRef.current.click();
              }}
              className="relative aspect-square md:w-40 flex justify-center items-center bg-gray-700 rounded cursor-pointer"
            >
              <input
                ref={imgInputRef}
                onChange={onSelectImage}
                type="file"
                hidden
              />
              {!!imageBase64 ? (
                <Image src={imageBase64} alt="" layout="fill" />
              ) : (
                <span className="text-2xl text-center">Project Logo</span>
              )}
            </div>
          </div>
          <div>
            <div>
              <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
                <div className="space-y-2 w-full sm:w-[50%]">
                  <label className="font-bold">
                    Name <span className="text-red-700">*</span>
                  </label>
                  <p className="text-sm text-gray-300">Name of the project</p>
                  <input
                    className="w-full rounded bg-gray-700 h-14 p-3 focus:bg-gray-800 transition-colors"
                    type="text"
                    value={configSet.name}
                    onChange={(e) =>
                      setConfigSet((c) => ({ ...c, name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2 w-full sm:w-[40%]">
                  <label className="font-bold">
                    Symbol <span className="text-red-700">*</span>
                  </label>
                  <p className="text-sm text-gray-300">Symbol of NFT tokens</p>
                  <input
                    className="w-full rounded bg-gray-700 h-14 p-3 focus:bg-gray-800 transition-colors"
                    type="text"
                    value={configSet.symbol}
                    onChange={(e) =>
                      setConfigSet((c) => ({ ...c, symbol: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2 w-full sm:w-[50%]">
                  <label className="font-bold">Collection Type</label>
                  <p className="text-sm text-gray-300">
                    Select Project Standard
                  </p>
                  <select
                    value={configSet.collectionType}
                    onChange={(e) =>
                      setConfigSet((c) => ({
                        ...c,
                        collectionType:
                          e.target.value === "721" ? "721" : "1155",
                      }))
                    }
                    className="w-full rounded bg-gray-700 h-14 p-3 focus:bg-gray-800 transition-colors"
                  >
                    <option value={"721"}>ERC721</option>
                    <option value={"1155"}>ERC1155</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
                <div className="space-y-2 w-full">
                  <label className="font-bold">Max Mint Cap</label>
                  <p className="text-sm text-gray-300">
                    Total Supply Limit for the collection
                  </p>
                  <input
                    className="w-full rounded bg-gray-700 h-14 p-3 focus:bg-gray-800 transition-colors"
                    type="text"
                    value={configSet.maxLimitCap || ""}
                    placeholder="0"
                    onChange={(e) =>
                      setConfigSet((c) => ({
                        ...c,
                        maxLimitCap: isNaN(+e.target.value)
                          ? 0
                          : +(+e.target.value).toFixed(0),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2 w-full">
                  <label className="font-bold">Royalty Percentage</label>
                  <p className="text-sm text-gray-300">
                    On every resale you will be earning this Percentage (Max
                    10%)
                  </p>
                  <input
                    type="number"
                    step={0.01}
                    min={0}
                    max={10}
                    className="bg-gray-700 h-14 p-3 focus:bg-gray-800 transition-colors rounded w-full"
                    value={configSet.roayltyPercentage || ""}
                    placeholder="0"
                    onChange={(e) =>
                      setConfigSet((c) => ({
                        ...c,
                        roayltyPercentage: isNaN(+e.target.value)
                          ? 0
                          : Math.min(+(+e.target.value).toFixed(2), 10),
                      }))
                    }
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <label
                  onClick={() => console.log(configSet.saleWaves)}
                  className="font-bold"
                >
                  Description
                </label>
                <p className="text-sm text-gray-300">
                  Description of the Project
                </p>
                <textarea
                  rows={5}
                  className="w-full rounded bg-gray-700 p-3 focus:bg-gray-800 transition-colors min-h-[4rem]"
                  value={configSet.description}
                  onChange={(e) =>
                    setConfigSet((c) => ({ ...c, description: e.target.value }))
                  }
                ></textarea>
              </div>
              <div className="mt-4 flex flex-col sm:flex-row items-end gap-4">
                <div className="w-full space-y-2 sm:w-[60%]">
                  <label className="font-bold">
                    Charge Recipient Address{" "}
                    <span className="text-red-700">*</span>
                  </label>
                  <p className="text-sm text-gray-300">
                    All the mint charges will go to this address
                  </p>
                  <input
                    className="w-full rounded bg-gray-700 h-14 p-3 focus:bg-gray-800 transition-colors"
                    type="text"
                    value={configSet.feeToAddress}
                    onChange={(e) =>
                      setConfigSet((c) => ({
                        ...c,
                        feeToAddress: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2 w-full sm:w-[40%]">
                  <label className="font-bold">
                    Max Mint Per Wallet in Total
                  </label>
                  <p className="text-sm text-gray-300">
                    Max mint limit for a wallet in this collection
                  </p>
                  <input
                    className="w-full rounded bg-gray-700 h-14 p-3 focus:bg-gray-800 transition-colors"
                    type="text"
                    value={configSet.maxMintInTotalPerWallet || ""}
                    placeholder="Unlimited"
                    onChange={(e) => {
                      setConfigSet((c) => ({
                        ...c,
                        maxMintInTotalPerWallet:
                          isNaN(+e.target.value) ||
                          e.target.value === "" ||
                          +e.target.value === 0
                            ? 0
                            : Math.abs(+(+e.target.value).toFixed(0)),
                      }));
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <div
                onClick={() => {
                  if (unrevealedImgInputRef && unrevealedImgInputRef.current)
                    unrevealedImgInputRef.current.click();
                }}
                className="relative aspect-square md:w-48 flex justify-center items-center bg-gray-700 rounded cursor-pointer"
              >
                <input
                  ref={unrevealedImgInputRef}
                  onChange={onSelectUnrevealedImage}
                  type="file"
                  hidden
                />
                {!!unrevealedImageBase64 ? (
                  <Image src={unrevealedImageBase64} alt="" layout="fill" />
                ) : (
                  <span className="text-2xl text-center">
                    Unrevealed NFT Image
                  </span>
                )}
              </div>
              <div className="space-y-2 w-full">
                <label className="font-bold">
                  Reveal Time{" "}
                  <span className="text-xs font-normal">
                    ( {new Date().toString().match(/\(([^\)]+)\)$/)?.[1]} )
                  </span>
                </label>
                <p className="text-sm text-gray-300">
                  When to reveal the metadata
                </p>
                <input
                  className="w-full rounded bg-gray-700 h-14 p-3 focus:bg-gray-800 transition-colors"
                  type="datetime-local"
                  value={formatHtmlDateTime(
                    new Date(configSet.revealTime * 1000)
                  )}
                  onChange={(e) =>
                    setConfigSet((c) => ({
                      ...c,
                      revealTime: +(+new Date(e.target.value) / 1000).toFixed(
                        0
                      ),
                    }))
                  }
                />
              </div>
            </div>
          </div>

          {configSet.saleWaves.length === 0 && (
            <div className="bg-gray-700 rounded-xl text-center font-bold p-4 mt-6">
              No Sale Wave is set. Without a Sale Wave no one will be able to
              mint
            </div>
          )}
          {configSet.saleWaves.length > 0 && (
            <div className="mt-4 space-y-2">
              <label className="font-bold">Sale Waves</label>
              <p className="text-sm text-gray-300">
                {configSet.saleWaves.length} salewave
                {configSet.saleWaves.length > 1 && "s"} added
              </p>
              {configSet.saleWaves.map((sw, idx) => (
                <SaleConfigInput
                  key={sw.uuid}
                  saleWaveConfig={sw}
                  setConfigSet={setConfigSet}
                  index={idx}
                  collectionType={configSet.collectionType}
                />
              ))}
            </div>
          )}
          <div className="flex justify-end">
            <button
              onClick={() =>
                setConfigSet((c) => ({
                  ...c,
                  saleWaves: [
                    ...c.saleWaves,
                    {
                      enabled: true,
                      endTime: 0,
                      maxMintInSale: 1000,
                      maxMintPerWallet: c.collectionType === "721" ? 5 : 1000,
                      mintCharge: c.collectionType === "721" ? 0.001 : 0.000001,
                      startTime: +(Date.now() / 1000).toFixed(0),
                      uuid: v4(),
                      whitelistAddresses: [],
                      saleType: "private",
                      noDeadline: false,
                      tokenGatedAddress: "",
                    },
                  ],
                }))
              }
              className="p-2 w-60 bg-blue-800 text-white hover:bg-blue-700 transition-colors rounded my-4"
            >
              Add Sale Wave
            </button>
          </div>

          <div className="mt-4 space-y-2">
            <label className="font-bold">Royalty Receiver Address</label>
            <p className="text-sm text-gray-300">
              On every resale of an NFT from this collection a RoyaltyPercentage
              (Max 10%) will be sent to this address
            </p>
            {/* <div className="flex flex-wrap sm:flex-nowrap items-center gap-4">
              <input
                className="flex-grow rounded bg-gray-700 h-14 p-3 focus:bg-gray-800 transition-colors"
                type="text"
                value={configSet.roayltyReceiver}
                onChange={(e) =>
                  setConfigSet((c) => ({
                    ...c,
                    roayltyReceiver: e.target.value,
                  }))
                }
              />
              <div className="flex items-center gap-2 bg-gray-700 rounded">
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.01}
                  className="bg-gray-700 h-14 p-3 focus:bg-gray-800 transition-colors rounded"
                  defaultValue={configSet.roayltyPercentage}
                  placeholder="0"
                  onChange={(e) =>
                    setConfigSet((prev) => ({
                      ...prev,
                      roayltyPercentage:
                        isNaN(e.target.valueAsNumber) || e.target.value === ""
                          ? 0
                          : +e.target.valueAsNumber.toFixed(2) > 10
                          ? 10
                          : +e.target.valueAsNumber.toFixed(2),
                    }))
                  }
                />
                <span className="p-2 bg-gray-700">%</span>
              </div>
            </div> */}
          </div>
          <div>
            <button
              disabled={!!bgProcessRunning}
              className="bg-indigo-600 text-white p-3 w-full my-4 rounded-xl hover:bg-blue-800 transition-colors cursor-pointer disabled:text-gray-400 disabled:bg-indigo-300 disabled:cursor-not-allowed"
              onClick={onDeployClick}
            >
              Deploy Contract
            </button>
            <p className="text-sm text-gray-300 text-center">
              Requires Transaction on Deploy
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const cookie = getHttpCookie(context.req, context.res);
  try {
    let cookieAddress: string | null;
    try {
      cookieAddress = getCookieWallet(cookie);
    } catch (error) {
      cookieAddress = null;
    }
    if (!cookieAddress)
      return {
        props: {},
        redirect: { destination: authPageUrlWithMessage("Sign Required") },
      };
    const dbUser = await getUserByWalletAddress(cookieAddress);
    if (!dbUser)
      return {
        props: {},
        redirect: { destination: authPageUrlWithMessage("Sign Required") },
      };
    return { props: { cookieAddress, baseUri: BASE_URI } };
  } catch (error) {
    return {
      props: {},
      redirect: {
        destination: authPageUrlWithMessage(
          errorHasMessage(error) ? error.message : "Error authenticating user"
        ),
      },
    };
  }
};

export default NewProject;

// const CloseIcon = () => (
//   <svg
//     xmlns="http://www.w3.org/2000/svg"
//     className="h-5 w-5"
//     viewBox="0 0 20 20"
//     fill="currentColor"
//   >
//     <path
//       fillRule="evenodd"
//       d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
//       clipRule="evenodd"
//     />
//   </svg>
// );
