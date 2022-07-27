import { useEthers } from "@usedapp/core";
import { Contract, getDefaultProvider } from "ethers";
import { isAddress } from "ethers/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import toast, { LoaderIcon } from "react-hot-toast";
import { v4 } from "uuid";
import { ABI1155, ABI721 } from "../../constants/abis";
import { RPC_URLS } from "../../constants/RPC_URL";
import useDebounce from "../../hooks/useDebounce";
import { uploadFileToFirebase } from "../../lib/firebase";
import { service } from "../../service";
import { IDeployConfigSet } from "../../types";

const SettingsSection = ({
  projectId,
  projectAddress,
  projectChainId,
  collectionType,
  projectOwner,
}: {
  projectId: number;
  projectChainId: number | null;
  projectAddress: string | null;
  collectionType: string | null;
  projectOwner: string | null;
}) => {
  const { account, library, chainId } = useEthers();
  const router = useRouter();
  const [basicDataBgProc, setBasicDataBgProc] = useState(0);
  const [feeAddressBgProc, setFeeAddressBgProc] = useState(0);
  const [baseURIBgProc, setBaseURIBgProc] = useState(0);
  const [isUidUnavailable, setIsUidUnavailable] = useState(false);

  const [configSet, setConfigSet] = useState<
    IDeployConfigSet & { baseURI: string }
  >({
    name: "",
    description: "",
    feeToAddress: "",
    logo: null,
    banner: null,
    symbol: "",
    uid: "",
    saleWaves: [],
    baseURI: "",
    roayltyPercentage: 0,
    roayltyReceiver: "",
  });
  const [imageBase64Logo, setImageBase64Logo] = useState("");
  const logoImgInputRef = useRef<HTMLInputElement | null>(null);
  const [imageBase64Banner, setImageBase64Banner] = useState("");
  const bannerImgInputRef = useRef<HTMLInputElement | null>(null);
  const [currentUid, setCurrentUid] = useState("");
  const onSelectLogoImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target && typeof ev.target.result === "string")
        setImageBase64Logo(ev.target.result);
    };
    reader.readAsDataURL(file);
    setConfigSet((c) => ({ ...c, logo: file }));
  };
  const onSelectBannerImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target && typeof ev.target.result === "string")
        setImageBase64Banner(ev.target.result);
    };
    reader.readAsDataURL(file);
    setConfigSet((c) => ({ ...c, banner: file }));
  };
  useEffect(() => {
    try {
      (async () => {
        if (!projectAddress || !projectChainId || !RPC_URLS[projectChainId])
          return;
        const contract = new Contract(
          projectAddress,
          collectionType === "721" ? ABI721 : ABI1155,
          getDefaultProvider(RPC_URLS[projectChainId])
        );
        setFeeAddressBgProc((v) => v + 1);
        setBaseURIBgProc((v) => v + 1);
        const [feeToAddress, curi, baseURI] = await Promise.all([
          contract.feeDestination(),
          contract.contractURI(),
          contract.baseURI(),
        ]);
        console.log("CURi : ", curi);

        setConfigSet((c) => ({
          ...c,
          feeToAddress,
          baseURI,
        }));
        setFeeAddressBgProc((v) => v - 1);
        setBaseURIBgProc((v) => v - 1);
      })();
    } catch (error) {
      setBaseURIBgProc((v) => v - 1);
      setFeeAddressBgProc((v) => v - 1);
      console.log("Error fetching fee to address, base URI : ", error);
      toast.error("Error fetching fee to address, base URI");
    }
  }, [collectionType, projectAddress, projectChainId]);
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
          setImageBase64Logo(project.data.imageUrl);
          setImageBase64Banner(project.data.bannerUrl);
          setConfigSet((c) => ({
            ...c,
            description: project.data.description,
            name: project.data.name,
            uid: project.data.uid || "",
            roayltyPercentage: project.data.royaltyPercentage || 0,
            roayltyReceiver: project.data.royaltyReceiver || "",
          }));
          setCurrentUid(project.data.uid || "");
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
      if (!configSet.name) {
        toast.error("Name is required");
        return;
      }
      if (!/^[A-Za-z0-9 -_]+$/.test(configSet.name)) {
        toast.error("Name must be alphanumeric");
        return;
      }
      if (isUidUnavailable) {
        toast.error("UID is not available, please choose something else");
        return;
      }
      if (
        configSet.roayltyReceiver !== "" &&
        !isAddress(configSet.roayltyReceiver)
      ) {
        toast.error("Invalid royalty receiver address");
        return;
      }
      setBasicDataBgProc((v) => v + 1);
      let imageUrl: string | null = null;
      if (configSet.logo) {
        imageUrl = await toast.promise(uploadFileToFirebase(configSet.logo), {
          error: "Error uploading image",
          loading: "Uploading image...",
          success: "Image uploaded successfully",
        });
      }
      let bannerUrl: string | null = null;
      if (configSet.banner) {
        bannerUrl = await toast.promise(
          uploadFileToFirebase(configSet.banner),
          {
            error: "Error uploading image",
            loading: "Uploading image...",
            success: "Image uploaded successfully",
          }
        );
      }
      const { data: project } = await toast.promise(
        service.put(`/projects/${projectId}`, {
          name: configSet.name,
          description: configSet.description,
          imageUrl: imageUrl ? imageUrl : imageBase64Logo,
          bannerUrl: bannerUrl ? bannerUrl : imageBase64Banner,
          uid: configSet.uid.trim() || v4(),
          royaltyReceiver: configSet.roayltyReceiver,
          royaltyPercentage: configSet.roayltyPercentage,
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

  const handleBaseUriUpdate = async () => {
    if (!account || !library || !chainId) {
      toast.error("Please connect your wallet");
      return;
    }
    if (!projectAddress || !projectChainId || !RPC_URLS[projectChainId]) {
      toast.error("Error loading project");
      return;
    }
    if (chainId !== projectChainId) {
      toast.error(`Please switch to network id ${projectChainId}`);
      return;
    }
    if (account !== projectOwner) {
      toast.error("You are not project owner");
    }
    try {
      const contract = new Contract(
        projectAddress,
        collectionType === "721" ? ABI721 : ABI1155,
        library.getSigner(account)
      );
      setBaseURIBgProc((v) => v + 1);
      const tx = await toast.promise(
        contract.updateBaseURI(configSet.baseURI),
        {
          error: "Error sending transaction",
          loading: "Sending transaction...",
          success: "Transaction sent",
        }
      );
      await toast.promise((tx as any).wait(), {
        error: "Mining failed",
        loading: "Mining transaction...",
        success: "Transaction Completed",
      });
      setBaseURIBgProc((v) => v - 1);
    } catch (error) {
      setBaseURIBgProc((v) => v - 1);
      console.log("Error updating base URI : ", error);
      toast.error("Error updating Base URI");
    }
  };

  const handleFeetoAddressUpdate = async () => {
    if (!account || !library || !chainId) {
      toast.error("Please connect your wallet");
      return;
    }
    if (!projectAddress || !projectChainId || !RPC_URLS[projectChainId]) {
      toast.error("Error loading project");
      return;
    }
    if (chainId !== projectChainId) {
      toast.error(`Please switch to network id ${projectChainId}`);
      return;
    }
    if (account !== projectOwner) {
      toast.error("You are not project owner");
    }
    if (!isAddress(configSet.feeToAddress)) {
      toast.error("Invalid address");
      return;
    }
    const contract = new Contract(
      projectAddress,
      collectionType === "721" ? ABI721 : ABI1155,
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
      await toast.promise((tx as any).wait(), {
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
  useDebounce(
    () => {
      if (configSet.uid === "") {
        setIsUidUnavailable(false);
        return;
      }
      (async () => {
        try {
          const { data: isExist } = await service.get(
            `/projects/uid/exists?uid=${configSet.uid.trim()}`
          );
          setIsUidUnavailable(
            isExist.data && configSet.uid.trim() !== currentUid.trim()
          );
        } catch (error) {
          console.log("Error fetching uid availability : ", error);
        }
      })();
    },
    200,
    [configSet.uid]
  );
  return (
    <div className="mt-4">
      <div className="bg-gray-200 p-4 rounded relative overflow-hidden">
        {!!basicDataBgProc && (
          <div className="absolute right-5 top-5 z-10 scale-150">
            <LoaderIcon />
          </div>
        )}
        <div className="absolute top-0 right-0 left-0 text-gray-700 bg-white text-3xl font-medium text-center py-1 shadow-2xl z-10">
          <h1>Mint Page Preview</h1>
          <Link
            href={`https://gogo-mint.ashrhmn.com/mint/${configSet.uid}`}
            passHref
          >
            <div className="text-lg mt-7 border-2 border-gray-300 rounded text-left px-4 cursor-pointer hover:text-blue-500 transition-colors break-all">{`🌐 https://gogo-mint.ashrhmn.com/mint/${
              configSet.uid.trim().replaceAll(" ", "%20") || "<random-string>"
            }`}</div>
          </Link>
        </div>
        <div className="flex flex-col">
          <div className="border-2 border-gray-500 p-4 rounded-2xl">
            <div
              onClick={() => {
                if (bannerImgInputRef && bannerImgInputRef.current)
                  bannerImgInputRef.current.click();
              }}
              className="relative w-full h-60 flex mx-auto justify-center items-center bg-gray-300 rounded cursor-pointer translate-y-16"
            >
              <input
                ref={bannerImgInputRef}
                onChange={onSelectBannerImage}
                type="file"
                hidden
              />
              {!!imageBase64Banner ? (
                <Image
                  src={imageBase64Banner}
                  alt=""
                  layout="fill"
                  objectFit="cover"
                />
              ) : (
                <span className="text-2xl">+</span>
              )}
            </div>
            <div
              onClick={() => {
                if (logoImgInputRef && logoImgInputRef.current)
                  logoImgInputRef.current.click();
              }}
              className="relative aspect-square w-40 flex mx-auto justify-center items-center bg-gray-300 rounded cursor-pointer shadow-xl"
            >
              <input
                ref={logoImgInputRef}
                onChange={onSelectLogoImage}
                type="file"
                hidden
              />
              {!!imageBase64Logo ? (
                <Image
                  src={imageBase64Logo}
                  alt=""
                  layout="fill"
                  objectFit="cover"
                />
              ) : (
                <span className="text-2xl">+</span>
              )}
            </div>
            <h1 className="font-bold text-4xl text-center my-4">
              {configSet.name}
            </h1>
            <p className="text-center font-medium">{configSet.description}</p>
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
            <div className="mt-4 space-y-2">
              <label className="font-bold">Project UID</label>
              <input
                className="w-full rounded bg-gray-100 h-14 p-3 focus:bg-white transition-colors"
                type="text"
                disabled={!!basicDataBgProc}
                value={configSet.uid}
                onChange={(e) =>
                  setConfigSet((c) => ({ ...c, uid: e.target.value }))
                }
              />
              {isUidUnavailable && (
                <span className="text-red-600">
                  UID is not available, please choose something else
                </span>
              )}
            </div>
            <div className="mt-4 space-y-2">
              <label className="font-bold">Royalty Receiver</label>
              <div className="flex items-center gap-4">
                <input
                  className="w-full rounded bg-gray-100 h-14 p-3 focus:bg-white transition-colors"
                  type="text"
                  disabled={!!basicDataBgProc}
                  value={configSet.roayltyReceiver}
                  placeholder={account}
                  onChange={(e) =>
                    setConfigSet((c) => ({
                      ...c,
                      roayltyReceiver: e.target.value,
                    }))
                  }
                />
                <div className="flex items-center bg-gray-100 rounded">
                  <input
                    className="rounded bg-gray-100 h-14 p-3 focus:bg-white transition-colors"
                    type="number"
                    max={10}
                    min={0}
                    step={0.01}
                    value={configSet.roayltyPercentage}
                    onChange={(e) =>
                      setConfigSet((p) => ({
                        ...p,
                        roayltyPercentage: e.target.valueAsNumber,
                      }))
                    }
                  />
                  <span className="p-2">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-center">
          <button
            onClick={handleUpdateBasic}
            disabled={!!basicDataBgProc}
            className="rounded bg-blue-500 text-white p-2 w-full hover:bg-blue-700 transition-colors mt-4 disabled:bg-blue-400 disabled:text-gray-400 disabled:cursor-not-allowed"
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
            className="rounded bg-blue-500 text-white p-2 w-full hover:bg-blue-700 transition-colors mt-4 disabled:bg-blue-400 disabled:text-gray-400 disabled:cursor-not-allowed"
            onClick={handleFeetoAddressUpdate}
          >
            Update
          </button>
        </div>
      </div>
      <div className="bg-gray-200 rounded p-4 my-6 relative">
        {!!baseURIBgProc && (
          <div className="absolute right-5 top-5 z-10 scale-150">
            <LoaderIcon />
          </div>
        )}
        <div className="mt-4 space-y-2">
          <label className="font-bold">Base URI</label>
          <input
            className="w-full rounded bg-gray-100 h-14 p-3 focus:bg-white transition-colors"
            type="text"
            disabled={!!baseURIBgProc}
            value={configSet.baseURI}
            onChange={(e) =>
              setConfigSet((c) => ({ ...c, baseURI: e.target.value }))
            }
          />
        </div>
        <div>
          <button
            disabled={!!baseURIBgProc}
            className="rounded bg-blue-500 text-white p-2 w-full hover:bg-blue-700 transition-colors mt-4 disabled:bg-blue-400 disabled:text-gray-400 disabled:cursor-not-allowed"
            onClick={handleBaseUriUpdate}
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsSection;
