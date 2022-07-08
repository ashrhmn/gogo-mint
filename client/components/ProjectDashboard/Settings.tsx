import { useEthers } from "@usedapp/core";
import { Contract, getDefaultProvider } from "ethers";
import { isAddress } from "ethers/lib/utils";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import toast, { LoaderIcon } from "react-hot-toast";
import { ABI1155, ABI721 } from "../../constants/abis";
import { RPC_URLS } from "../../constants/RPC_URL";
import { uploadFileToFirebase } from "../../lib/firebase";
import { service } from "../../service";
import { IDeployConfigSet } from "../../types";

const SettingsSection = ({
  projectId,
  projectAddress,
  projectChainId,
  collectionype,
}: {
  projectId: number;
  projectChainId: number | null;
  projectAddress: string | null;
  collectionype: string | null;
}) => {
  const { account, library } = useEthers();
  const router = useRouter();
  const [basicDataBgProc, setBasicDataBgProc] = useState(0);
  const [feeAddressBgProc, setFeeAddressBgProc] = useState(0);

  const [configSet, setConfigSet] = useState<IDeployConfigSet>({
    name: "",
    description: "",
    feeToAddress: "",
    logo: null,
    symbol: "",
    whitelistAddresses: [],
    privateMintCharge: 0,
    publicMintCharge: 0,
  });
  const [imageBase64, setImageBase64] = useState("");
  const imgInputRef = useRef<HTMLInputElement | null>(null);
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
  useEffect(() => {
    try {
      (async () => {
        if (!projectAddress || !projectChainId || !RPC_URLS[projectChainId])
          return;
        const contract = new Contract(
          projectAddress,
          collectionype === "721" ? ABI721 : ABI1155,
          getDefaultProvider(RPC_URLS[projectChainId])
        );
        setFeeAddressBgProc((v) => v + 1);
        const feeToAddress = await contract.feeDestination();
        setConfigSet((c) => ({ ...c, feeToAddress }));
        setFeeAddressBgProc((v) => v - 1);
      })();
    } catch (error) {
      setFeeAddressBgProc((v) => v - 1);
      console.log("Error fetching fee to address : ", error);
      toast.error("Error fetching fee to address");
    }
  }, [collectionype, projectAddress, projectChainId]);
  useEffect(() => {
    try {
      (async () => {
        if (projectId) {
          setBasicDataBgProc((v) => v + 1);
          const { data: project } = await service.get(`/projects/${projectId}`);
          console.log(project);
          if (project.error) {
            console.log(project.error);
            return;
          }
          setImageBase64(project.data.imageUrl);
          setConfigSet((c) => ({
            ...c,
            description: project.data.description,
            name: project.data.name,
            whitelistAddresses: project.data.whitelist,
          }));
          setBasicDataBgProc((v) => v - 1);
        }
      })();
    } catch (error) {
      setBasicDataBgProc((v) => v - 1);
      console.log("Error fetching basic data : ", error);
      toast.error("Error fetching data");
    }
  }, [projectId]);
  const handleUpdateBasic = async () => {
    try {
      setBasicDataBgProc((v) => v + 1);
      let imageUrl: string | null = null;
      if (configSet.logo) {
        imageUrl = await toast.promise(uploadFileToFirebase(configSet.logo), {
          error: "Error uploading image",
          loading: "Uploading image...",
          success: "Image uploaded successfully",
        });
      }
      const { data: project } = await toast.promise(
        service.put(`/projects/${projectId}`, {
          name: configSet.name,
          description: configSet.description,
          imageUrl: imageUrl ? imageUrl : imageBase64,
        }),
        {
          error: "Error updating data",
          loading: "Updating data...",
          success: "Data updated successfully",
        }
      );
      setBasicDataBgProc((v) => v - 1);
      if (!project.error) router.reload();
    } catch (error) {
      setBasicDataBgProc((v) => v - 1);
      console.log("Error updating data : ", error);
    }
  };
  const handleFeetoAddressUpdate = async () => {
    if (!account || !library) {
      toast.error("Please connect your wallet");
      return;
    }
    if (!isAddress(configSet.feeToAddress)) {
      toast.error("Invalid address");
      return;
    }
    if (!projectAddress || !projectChainId || !RPC_URLS[projectChainId]) {
      toast.error("Error loading project");
      return;
    }
    const contract = new Contract(
      projectAddress,
      collectionype === "721" ? ABI721 : ABI1155,
      library.getSigner(account)
    );
    try {
      setFeeAddressBgProc((v) => v + 1);
      const tx = await toast.promise(
        contract.updateFeeToAddress(configSet.feeToAddress),
        {
          error: "Error sending transaction",
          loading: "Sending transaction...",
          success: "Transaction sent",
        }
      );
      const rec = await toast.promise((tx as any).wait(), {
        error: "Mining failed",
        loading: "Mining transaction...",
        success: "Transaction Completed",
      });
      setFeeAddressBgProc((v) => v - 1);
    } catch (error) {
      setFeeAddressBgProc((v) => v - 1);
      console.log("Error updating fee destination : ", error);
      toast.error("Error updating fee destination");
    }
  };
  return (
    <div className="mt-4">
      <div className="bg-gray-200 p-4 rounded relative">
        {!!basicDataBgProc && (
          <div className="absolute right-5 top-5 z-10 scale-150">
            <LoaderIcon />
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-end sm:gap-4">
          <div
            onClick={() => {
              if (imgInputRef && imgInputRef.current)
                imgInputRef.current.click();
            }}
            className="relative aspect-square sm:w-40 flex justify-center items-center bg-gray-300 rounded cursor-pointer"
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
          <div className="w-full">
            <div className="mt-4 space-y-2">
              <label className="font-bold">
                Name <span className="text-red-700">*</span>
              </label>
              <input
                className="w-full rounded bg-gray-100 h-14 p-3 focus:bg-white transition-colors"
                type="text"
                disabled={!!basicDataBgProc}
                value={configSet.name}
                onChange={(e) =>
                  setConfigSet((c) => ({ ...c, name: e.target.value }))
                }
              />
            </div>
            <div className="mt-4 space-y-2">
              <label className="font-bold">Description</label>
              <input
                className="w-full rounded bg-gray-100 h-14 p-3 focus:bg-white transition-colors"
                type="text"
                disabled={!!basicDataBgProc}
                value={configSet.description}
                onChange={(e) =>
                  setConfigSet((c) => ({ ...c, description: e.target.value }))
                }
              />
            </div>
          </div>
        </div>
        <div className="flex justify-center">
          <button
            onClick={handleUpdateBasic}
            disabled={!!basicDataBgProc}
            className="bg-blue-500 text-white p-2 w-full hover:bg-blue-700 transition-colors mt-4 disabled:bg-blue-400 disabled:text-gray-400"
          >
            Update
          </button>
        </div>
      </div>
      <div className="bg-gray-200 rounded p-4 my-6 relative">
        {!!feeAddressBgProc && (
          <div className="absolute right-5 top-5 z-10 scale-150">
            <LoaderIcon />
          </div>
        )}
        <div className="mt-4 space-y-2">
          <label className="font-bold">Fee Receiver Address</label>
          <input
            className="w-full rounded bg-gray-100 h-14 p-3 focus:bg-white transition-colors"
            type="text"
            disabled={!!feeAddressBgProc}
            value={configSet.feeToAddress}
            onChange={(e) =>
              setConfigSet((c) => ({ ...c, feeToAddress: e.target.value }))
            }
          />
        </div>
        <div>
          <button
            disabled={!!feeAddressBgProc}
            className="bg-blue-500 text-white p-2 w-full hover:bg-blue-700 transition-colors mt-4 disabled:bg-blue-400 disabled:text-gray-400"
            onClick={handleFeetoAddressUpdate}
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsSection;
