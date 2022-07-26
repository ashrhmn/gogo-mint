import { shortenIfAddress, useEthers } from "@usedapp/core";
import { ContractFactory } from "ethers";
import { isAddress } from "ethers/lib/utils";
import { GetServerSideProps, NextPage } from "next";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { v4 } from "uuid";
import SaleConfigInput from "../../components/Projects/SaleConfigInput";
import { BASE_API_URL } from "../../constants/configuration";
import { uploadFileToFirebase } from "../../lib/firebase";
import { service } from "../../service";
import { getCookieWallet } from "../../services/auth.service";
import { getUserByWalletAddress } from "../../services/user.service";
import { IDeployConfigSet } from "../../types";
import { errorHasMessage } from "../../utils/Error.utils";
import { getHttpCookie } from "../../utils/Request.utils";
import { authPageUrlWithMessage } from "../../utils/Response.utils";
import { normalizeString } from "../../utils/String.utils";

interface Props {
  cookieAddress: string;
  baseUri: string;
}

const NewProject: NextPage<Props> = ({ cookieAddress, baseUri }) => {
  const { account, library, chainId } = useEthers();
  const imgInputRef = useRef<HTMLInputElement | null>(null);
  const [bgProcessRunning, setBgProcessRunning] = useState(0);
  const router = useRouter();
  const [configSet, setConfigSet] = useState<IDeployConfigSet>({
    name: "",
    description: "",
    feeToAddress: "",
    logo: null,
    banner: null,
    symbol: "",
    saleWaves: [],
    uid: "",
  });
  useEffect(() => {
    if (account) setConfigSet((c) => ({ ...c, feeToAddress: account }));
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

  const onDeployClick = async () => {
    if (!library) {
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
    if (!/^[A-Za-z0-9 -_]+$/.test(configSet.name)) {
      toast.error("Name must be alphanumeric");
      return;
    }
    if (!/^[A-Za-z0-9 -_]+$/.test(configSet.symbol)) {
      toast.error("Symbol must be alphanumeric");
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
    if (!configSet.symbol) {
      toast.error("Symbol is required");
      return;
    }
    setBgProcessRunning((v) => v + 1);
    try {
      const [
        imageUrl,
        { data: saleConfigRoot },
        { data: initCode },
        { data: platformSignerAddress },
      ] = await toast.promise(
        Promise.all([
          uploadFileToFirebase(configSet.logo),
          service.post(`sale-config/root`, {
            saleConfigs: configSet.saleWaves.map((sw) => ({
              ...sw,
              whitelistAddresses:
                sw.saleType === "public"
                  ? []
                  : sw.whitelistAddresses.includes(account)
                  ? sw.whitelistAddresses
                  : [...sw.whitelistAddresses, account],
            })),
          }),
          service.get(`contract/collection721?name=${configSet.name}`),
          service.get(`platform-signer/public-address`),
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
      if (initCode.error) {
        toast.error("Error contract data");
        setBgProcessRunning((v) => v - 1);
        return;
      }
      const factory = new ContractFactory(
        initCode.data.abi,
        initCode.data.bytecode,
        library.getSigner(account)
      );

      const contract = await toast.promise(
        factory.deploy(
          normalizeString(configSet.name),
          normalizeString(configSet.symbol),
          configSet.feeToAddress,
          saleConfigRoot.data,
          platformSignerAddress.data,
          baseUri
        ),
        {
          success: "Transaction sent",
          error: "Error sending transaction",
          loading: "Sending transaction...",
        }
      );

      const [newProject] = await toast.promise(
        Promise.all([
          service.post(`/projects`, {
            name: configSet.name,
            address: contract.address,
            description: configSet.description,
            imageUrl,
            chainId,
            collectionType: "721",
            signerAddress: account,
            uid: v4(),
            saleConfigs: configSet.saleWaves.map((sw) => ({
              ...sw,
              whitelistAddresses:
                sw.saleType === "public"
                  ? []
                  : sw.whitelistAddresses.includes(account)
                  ? sw.whitelistAddresses
                  : [...sw.whitelistAddresses, account],
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
      //   console.log(newProject.data);
      //   console.log(contract);
      setBgProcessRunning((v) => v - 1);

      router.push(
        `/dashboard/project?contract=${contract.address}&network=${chainId}`
      );
    } catch (error) {
      console.log(error);
      if ((error as any).message) toast.error((error as any).message);
      if (typeof error == "string") toast.error(error);
      setBgProcessRunning((v) => v - 1);
    }
  };

  return (
    <div className="text-xl border-2 rounded-xl p-4">
      <h1 className="text-4xl my-3 font-bold">NFT Drop</h1>
      <h1 className="text-2xl font-medium my-1">Contract Information</h1>
      <h2>Customize your new project</h2>
      <div>
        <div>
          <div
            onClick={() => {
              if (imgInputRef && imgInputRef.current)
                imgInputRef.current.click();
            }}
            className="relative aspect-square md:w-40 flex justify-center items-center bg-gray-300 rounded cursor-pointer"
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
              <span className="text-2xl">+</span>
            )}
          </div>
        </div>
        <div>
          <div>
            <div className="mt-4 space-y-2">
              <label className="font-bold">
                Name <span className="text-red-700">*</span>
              </label>
              <input
                className="w-full rounded bg-gray-100 h-14 p-3 focus:bg-white transition-colors"
                type="text"
                value={configSet.name}
                onChange={(e) =>
                  setConfigSet((c) => ({ ...c, name: e.target.value }))
                }
              />
            </div>
            <div className="mt-4 space-y-2">
              <label className="font-bold">
                Symbol <span className="text-red-700">*</span>
              </label>
              <input
                className="w-full rounded bg-gray-100 h-14 p-3 focus:bg-white transition-colors"
                type="text"
                value={configSet.symbol}
                onChange={(e) =>
                  setConfigSet((c) => ({ ...c, symbol: e.target.value }))
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
            <input
              className="w-full rounded bg-gray-100 h-14 p-3 focus:bg-white transition-colors"
              type="text"
              value={configSet.description}
              onChange={(e) =>
                setConfigSet((c) => ({ ...c, description: e.target.value }))
              }
            />
          </div>
        </div>
        <button
          onClick={() =>
            setConfigSet((c) => ({
              ...c,
              saleWaves: [
                ...c.saleWaves,
                {
                  enabled: true,
                  endTime: 0,
                  maxMintInSale: 0,
                  maxMintPerWallet: 0,
                  mintCharge: 0,
                  startTime: 0,
                  uuid: v4(),
                  whitelistAddresses: [],
                  saleType: "private",
                  noDeadline: false,
                },
              ],
            }))
          }
          className="p-2 w-60 bg-blue-500 text-white hover:bg-blue-700 transition-colors rounded my-4"
        >
          Add Sale Wave
        </button>
        {configSet.saleWaves.length == 0 && (
          <div className="bg-gray-200 rounded-xl text-center font-bold p-4">
            No Sale Wave is set. Without a Sale Wave no one will be able to mint
          </div>
        )}
        {configSet.saleWaves.map((sw, idx) => (
          <SaleConfigInput
            key={sw.uuid}
            saleWaveConfig={sw}
            setConfigSet={setConfigSet}
            index={idx}
          />
        ))}

        <div>
          <div className="mt-4 space-y-2">
            <label className="font-bold">
              Recipient Address <span className="text-red-700">*</span>
            </label>
            <input
              className="w-full rounded bg-gray-100 h-14 p-3 focus:bg-white transition-colors"
              type="text"
              value={configSet.feeToAddress}
              onChange={(e) =>
                setConfigSet((c) => ({ ...c, feeToAddress: e.target.value }))
              }
            />
          </div>
          <button
            disabled={!!bgProcessRunning}
            className="bg-indigo-600 text-white p-3 w-full my-4 rounded-xl hover:bg-blue-800 transition-colors cursor-pointer disabled:text-gray-400 disabled:bg-indigo-300 disabled:cursor-not-allowed"
            onClick={onDeployClick}
          >
            Deploy Contract
          </button>
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const cookie = getHttpCookie(context.req, context.res);
  try {
    const cookieAddress = getCookieWallet(cookie);
    const dbUser = await getUserByWalletAddress(cookieAddress);
    if (!dbUser)
      return {
        props: {},
        redirect: { destination: authPageUrlWithMessage("Sign Required") },
      };
    return { props: { cookieAddress, baseUri: BASE_API_URL } };
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

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
);
