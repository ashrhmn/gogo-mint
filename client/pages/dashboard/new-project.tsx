import { shortenAddress, useEthers } from "@usedapp/core";
import { ContractFactory } from "ethers";
import { isAddress, parseEther } from "ethers/lib/utils";
import { NextPage } from "next";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { uploadFileToFirebase } from "../../lib/firebase";
import { service } from "../../service";
import { IDeployConfigSet } from "../../types";
import { normalizeString } from "../../utils/String.utils";

const NewProject: NextPage = () => {
  const { account, library } = useEthers();
  const imgInputRef = useRef<HTMLInputElement | null>(null);
  const [bgProcessRunning, setBgProcessRunning] = useState(0);
  const [configSet, setConfigSet] = useState<IDeployConfigSet>({
    name: "My Collection",
    description: "",
    feeToAddress: "",
    logo: null,
    symbol: "MCN",
    whitelistAddresses: [
      "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4",
      "0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2",
      "0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db",
    ],
    privateMintCharge: 0,
    publicMintCharge: 0,
  });
  const [tempWhitelistAddress, setTempWhitelistAddress] = useState("");
  useEffect(() => {
    if (account) setConfigSet((c) => ({ ...c, feeToAddress: account }));
  }, [account]);
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
  const handleAddWhiteListButton = () => {
    if (!isAddress(tempWhitelistAddress)) {
      toast.error("Invalid address");
      return;
    }
    if (configSet.whitelistAddresses.includes(tempWhitelistAddress)) {
      toast.error("Address already in whitelist");
      return;
    }
    setConfigSet((c) => ({
      ...c,
      whitelistAddresses: [...c.whitelistAddresses, tempWhitelistAddress],
    }));
  };

  const onDeployClick = async (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
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
      const whitelist = configSet.whitelistAddresses.includes(account)
        ? configSet.whitelistAddresses
        : [...configSet.whitelistAddresses, account];
      const uploadImagePromise = uploadFileToFirebase(configSet.logo);
      const getWhitelistPromise = service.post(`merkletree`, {
        addresses: whitelist,
      });
      const getContractFilePromise = service.get(
        `contract/collection721?name=${configSet.name}`
      );
      const [imageUrl, { data: whitelistRoot }, { data: initCode }] =
        await toast.promise(
          Promise.all([
            uploadImagePromise,
            getWhitelistPromise,
            getContractFilePromise,
          ]),
          {
            success: "Contract Compiled Successfully",
            error: "Error compiling contract",
            loading: "Compiling contract...",
          }
        );
      console.log(imageUrl);
      console.log(whitelistRoot);
      console.log(initCode);
      if (whitelistRoot.error) {
        toast.error("Error getting whitelist root");
        return;
      }
      if (initCode.error) {
        toast.error("Error contract data");
        return;
      }
      const factory = new ContractFactory(
        initCode.data.abi,
        initCode.data.bytecode,
        library.getSigner(account)
      );
      const contract = await toast.promise(
        factory.deploy(
          configSet.feeToAddress,
          whitelistRoot.data,
          parseEther(configSet.privateMintCharge.toString()),
          parseEther(configSet.publicMintCharge.toString())
        ),
        {
          success: "Transaction sent",
          error: "Error sending transaction",
          loading: "Sending transaction...",
        }
      );
      const saveProjectToDbPromise = service.post(`/projects`, {
        name: configSet.name,
        address: contract.address,
        description: configSet.description,
        imageUrl,
        whitelist,
      });
      await toast.promise(
        Promise.all([saveProjectToDbPromise, contract.deployed()]),
        {
          success: "Contract deployed successfully",
          error: "Error deploying contract",
          loading: "Deploying contract...",
        }
      );
      //   console.log(contract);
      setBgProcessRunning((v) => v - 1);
    } catch (error) {
      console.log(error);
      if ((error as any).message) toast.error((error as any).message);
      if (typeof error == "string") toast.error(error);
      setBgProcessRunning((v) => v - 1);
    }
  };

  const handleWhitelistAddressDelete = (address: string) => {
    setConfigSet((c) => ({
      ...c,
      whitelistAddresses: c.whitelistAddresses.filter((a) => a !== address),
    }));
  };
  return (
    <div className="text-xl border-2 rounded-xl p-4">
      <h1 className="text-4xl my-3 font-bold">NFT Drop</h1>
      <h1 className="text-2xl font-medium my-1">Contract Information</h1>
      <h2>Customize your new project</h2>
      <form onSubmit={onDeployClick}>
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
            <label className="font-bold">Description</label>
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
        <div>
          <div className="mt-4 space-y-2">
            <label className="font-bold">
              Private Mint Charge <span className="text-red-700">*</span>
            </label>
            <input
              className="w-full rounded bg-gray-100 h-14 p-3 focus:bg-white transition-colors"
              type="number"
              value={configSet.privateMintCharge}
              step={0.01}
              onChange={(e) =>
                setConfigSet((c) => ({
                  ...c,
                  privateMintCharge: e.target.valueAsNumber,
                }))
              }
            />
          </div>
          <div className="mt-4 space-y-2">
            <label className="font-bold">
              Public Mint Charge <span className="text-red-700">*</span>
            </label>
            <input
              className="w-full rounded bg-gray-100 h-14 p-3 focus:bg-white transition-colors"
              type="number"
              step={0.01}
              value={configSet.publicMintCharge}
              onChange={(e) =>
                setConfigSet((c) => ({
                  ...c,
                  publicMintCharge: e.target.valueAsNumber,
                }))
              }
            />
          </div>
        </div>
        <div>
          <div className="mt-4 space-y-2">
            <label className="font-bold">Add Whitelist addresses</label>
            <div className="flex items-center gap-3">
              <input
                className="w-full rounded bg-gray-100 h-14 p-3 focus:bg-white transition-colors"
                type="text"
                value={tempWhitelistAddress}
                onChange={(e) => setTempWhitelistAddress(e.target.value)}
              />
              <button
                onClick={handleAddWhiteListButton}
                className="bg-blue-600 text-white h-14 w-28 rounded"
              >
                Add
              </button>
            </div>
          </div>
        </div>
        <div className="my-4">
          {configSet.whitelistAddresses.map((address) => (
            <div className="flex gap-4 relative my-2" key={address}>
              <div className="w-full overflow-hidden group">
                <div className="overflow-hidden w-full">{address}</div>
                <div className="absolute -top-6 hidden group-hover:block text-sm rounded shdaow-xl bg-gray-500 p-1 text-white z-10">
                  {address}
                </div>
              </div>
              <button
                onClick={() => handleWhitelistAddressDelete(address)}
                className="hover:bg-gray-500 rounded-full overflow-hidden h-8 w-8 hover:text-white transition-colors flex justify-center items-center"
              >
                <CloseIcon />
              </button>
            </div>
          ))}
        </div>
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
          <input
            type="submit"
            disabled={!!bgProcessRunning}
            className="bg-indigo-600 text-white p-3 w-full my-4 rounded-xl hover:bg-blue-800 transition-colors cursor-pointer disabled:text-gray-400 disabled:bg-indigo-300 disabled:cursor-not-allowed"
            value="Deploy Contract"
          />
        </div>
      </form>
    </div>
  );
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
