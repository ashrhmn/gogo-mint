import { useEthers } from "@usedapp/core";
import { getChainById } from "@usedapp/core/dist/esm/src/helpers";
import { Contract, getDefaultProvider } from "ethers";
import { formatEther, isAddress, parseEther } from "ethers/lib/utils";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import toast, { LoaderIcon } from "react-hot-toast";
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
  whitelist,
}: {
  projectId: number;
  projectChainId: number | null;
  projectAddress: string | null;
  collectionType: string | null;
  whitelist: string[];
}) => {
  const { account, library, chainId } = useEthers();
  const router = useRouter();
  const [basicDataBgProc, setBasicDataBgProc] = useState(0);
  const [feeAddressBgProc, setFeeAddressBgProc] = useState(0);
  const [whitelistBgProc, setWhitelistBgProc] = useState(0);
  const [privateMintChargeBgProc, setPrivateMintChargeBgProc] = useState(0);
  const [publicMintChargeBgProc, setPublicMintChargeBgProc] = useState(0);
  const [privateMintLimitBgProc, setPrivateMintLimitBgProc] = useState(0);
  const [publicMintLimitBgProc, setPublicMintLimitBgProc] = useState(0);
  const [isUidUnavailable, setIsUidUnavailable] = useState(false);
  const [tempWhitelistAddress, setTempWhitelistAddress] = useState("");
  const [privateMintLimit, setPrivateMintLimit] = useState(0);
  const [publicMintLimit, setPublicMintLimit] = useState(0);

  const [configSet, setConfigSet] = useState<IDeployConfigSet>({
    name: "",
    description: "",
    feeToAddress: "",
    logo: null,
    symbol: "",
    whitelistAddresses: whitelist,
    privateMintCharge: 0,
    publicMintCharge: 0,
    uid: "",
  });
  const [imageBase64, setImageBase64] = useState("");
  const imgInputRef = useRef<HTMLInputElement | null>(null);
  const [currentUid, setCurrentUid] = useState("");
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
          collectionType === "721" ? ABI721 : ABI1155,
          getDefaultProvider(RPC_URLS[projectChainId])
        );
        setFeeAddressBgProc((v) => v + 1);
        setPrivateMintChargeBgProc((v) => v + 1);
        setPublicMintChargeBgProc((v) => v + 1);
        const [feeToAddress, privateMintCharge, publicMintCharge, curi] =
          await Promise.all([
            contract.feeDestination(),
            contract.privateMintCharge(),
            contract.publicMintCharge(),
            contract.contractURI(),
          ]);
        console.log("CURi : ", curi);

        setConfigSet((c) => ({
          ...c,
          feeToAddress,
          privateMintCharge: +formatEther(privateMintCharge),
          publicMintCharge: +formatEther(publicMintCharge),
        }));
        setFeeAddressBgProc((v) => v - 1);
        setPrivateMintChargeBgProc((v) => v - 1);
        setPublicMintChargeBgProc((v) => v - 1);
      })();
    } catch (error) {
      setFeeAddressBgProc((v) => v - 1);
      setPrivateMintChargeBgProc((v) => v - 1);
      setPublicMintChargeBgProc((v) => v - 1);
      console.log("Error fetching fee to address : ", error);
      toast.error("Error fetching fee to address");
    }
  }, [collectionType, projectAddress, projectChainId]);
  useEffect(() => {
    try {
      (async () => {
        if (projectId) {
          setBasicDataBgProc((v) => v + 1);
          setWhitelistBgProc((v) => v + 1);
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
            uid: project.data.uid || "",
          }));
          setCurrentUid(project.data.uid || "");
          setBasicDataBgProc((v) => v - 1);
          setWhitelistBgProc((v) => v - 1);
        }
      })();
    } catch (error) {
      setBasicDataBgProc((v) => v - 1);
      setWhitelistBgProc((v) => v - 1);
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
          uid: configSet.uid === "" ? null : configSet.uid,
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
  const handleAddWhiteListButton = (e: any) => {
    e.preventDefault();
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
  const handleWhitelistAddressDelete = (address: string) => {
    setConfigSet((c) => ({
      ...c,
      whitelistAddresses: c.whitelistAddresses.filter((a) => a !== address),
    }));
  };
  const handleUpdateWhitelist = async () => {
    try {
      if (!account || !library || !chainId) {
        toast.error("Please connect your wallet");
        return;
      }
      if (!projectAddress || !projectChainId) {
        toast.error("Error loading project");
        return;
      }
      const whitelist = configSet.whitelistAddresses.includes(account)
        ? configSet.whitelistAddresses
        : [...configSet.whitelistAddresses, account];
      const { data: whitelistRoot } = await toast.promise(
        service.post(`merkletree`, {
          addresses: whitelist,
        }),
        {
          error: "Error generating whitelist hash",
          loading: "Generating whitelist hash",
          success: "Hash generated successfully",
        }
      );
      setWhitelistBgProc((v) => v + 1);
      const contract = new Contract(
        projectAddress,
        collectionType === "721" ? ABI721 : ABI1155,
        library.getSigner(account)
      );
      const tx = await toast.promise(
        contract.updateWhitelist(whitelistRoot.data),
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
      const project = await toast.promise(
        service.put(`/projects/${projectId}`, { whitelist }),
        {
          error: "Error updating whitelist data",
          loading: "Updating whitelist data",
          success: "Whitelist updated successfully",
        }
      );
      setWhitelistBgProc((v) => v - 1);
    } catch (error) {
      setWhitelistBgProc((v) => v - 1);
      toast.error("Error updating whitelist");
      console.log("Error updating whitelist : ", error);
    }
  };
  const handleUpdatePrivateMintCharge = async () => {
    try {
      if (!account || !library || !chainId) {
        toast.error("Please connect your wallet");
        return;
      }
      if (!projectAddress || !projectChainId) {
        toast.error("Error loading project");
        return;
      }
      if (configSet.privateMintCharge < 0) {
        toast.error("Charge can not be less than zero");
        return;
      }
      setPrivateMintChargeBgProc((v) => v + 1);
      const contract = new Contract(
        projectAddress,
        collectionType === "721" ? ABI721 : ABI1155,
        library.getSigner(account)
      );
      const tx = await toast.promise(
        contract.updatePrivateMintCharge(
          parseEther(configSet.privateMintCharge.toString())
        ),
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
      setPrivateMintChargeBgProc((v) => v - 1);
    } catch (error) {
      setPrivateMintChargeBgProc((v) => v - 1);
      console.log("Error updating private mint charge : ", error);
      toast.error("Error updating private mint charge");
    }
  };
  const handleUpdatePublicMintCharge = async () => {
    try {
      if (!account || !library || !chainId) {
        toast.error("Please connect your wallet");
        return;
      }
      if (!projectAddress || !projectChainId) {
        toast.error("Error loading project");
        return;
      }
      if (configSet.publicMintCharge < 0) {
        toast.error("Charge can not be less than zero");
        return;
      }
      setPublicMintChargeBgProc((v) => v + 1);
      const contract = new Contract(
        projectAddress,
        collectionType === "721" ? ABI721 : ABI1155,
        library.getSigner(account)
      );
      const tx = await toast.promise(
        contract.updatePublicMintCharge(
          parseEther(configSet.publicMintCharge.toString())
        ),
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
      setPublicMintChargeBgProc((v) => v - 1);
    } catch (error) {
      setPublicMintChargeBgProc((v) => v - 1);
      console.log("Error updating public mint charge : ", error);
      toast.error("Error updating public mint charge");
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
            `/projects/uid/exists?uid=${configSet.uid}`
          );
          setIsUidUnavailable(isExist.data && configSet.uid !== currentUid);
        } catch (error) {
          console.log("Error fetching uid availability : ", error);
        }
      })();
    },
    200,
    [configSet.uid]
  );
  useEffect(() => {
    (async () => {
      if (!projectAddress || !projectChainId || !RPC_URLS[projectChainId])
        return;
      try {
        setPrivateMintLimitBgProc((v) => v + 1);
        const contract = new Contract(
          projectAddress,
          collectionType == "721" ? ABI721 : ABI1155,
          getDefaultProvider(RPC_URLS[projectChainId])
        );
        const [privateMintLimit, publicMintLimit] = await Promise.all([
          contract.maxMintInPrivate(),
          contract.maxMintInPublic(),
        ]);
        setPrivateMintLimit(privateMintLimit.toString());
        setPublicMintLimit(publicMintLimit.toString());
        setPrivateMintLimitBgProc((v) => v - 1);
      } catch (error) {
        console.log("Error fetching limits : ", error);

        setPrivateMintLimitBgProc((v) => v - 1);
      }
    })();
  }, [collectionType, projectAddress, projectChainId]);

  const handleUpdatePrivateMintMaxLimit = async () => {
    if (!account || !library || !chainId) {
      toast.error("Please connect your wallet");
      return;
    }
    if (!projectAddress || !projectChainId || !RPC_URLS[projectChainId]) {
      toast.error("Error preparing contract");
      return;
    }
    try {
      setPrivateMintLimitBgProc((v) => v + 1);
      const contract = new Contract(
        projectAddress,
        collectionType === "721" ? ABI721 : ABI1155,
        library.getSigner(account)
      );
      const tx = await toast.promise(
        contract.updateMaxMintInPrivate(privateMintLimit),
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
      setPrivateMintLimitBgProc((v) => v - 1);
    } catch (error) {
      console.log("Error updating private mint limit : ", error);
      setPrivateMintLimitBgProc((v) => v - 1);
    }
  };

  const handleUpdatePublicMintMaxLimit = async () => {
    if (!account || !library || !chainId) {
      toast.error("Please connect your wallet");
      return;
    }
    if (!projectAddress || !projectChainId || !RPC_URLS[projectChainId]) {
      toast.error("Error preparing contract");
      return;
    }
    try {
      setPublicMintLimitBgProc((v) => v + 1);
      const contract = new Contract(
        projectAddress,
        collectionType === "721" ? ABI721 : ABI1155,
        library.getSigner(account)
      );
      const tx = await toast.promise(
        contract.updateMaxMintInPublic(publicMintLimit),
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
      setPublicMintLimitBgProc((v) => v - 1);
    } catch (error) {
      console.log("Error updating public mint limit : ", error);
      setPublicMintLimitBgProc((v) => v - 1);
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
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

      <div className="mt-4 bg-gray-200 rounded p-4 relative">
        {!!privateMintChargeBgProc && (
          <div className="absolute right-5 top-5 z-10 scale-150">
            <LoaderIcon />
          </div>
        )}
        <label className="font-bold">Private Mint Charge</label>
        <div className="flex items-center gap-4">
          <input
            className="w-full rounded bg-gray-100 h-14 p-3 focus:bg-white transition-colors"
            type="number"
            min={0}
            value={configSet.privateMintCharge}
            disabled={!!privateMintChargeBgProc}
            step={0.00001}
            onChange={(e) =>
              setConfigSet((c) => ({
                ...c,
                privateMintCharge: e.target.valueAsNumber,
              }))
            }
          />
          <button
            disabled={!!privateMintChargeBgProc}
            className="rounded bg-blue-500 text-white p-2 w-40 hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:text-gray-400 disabled:cursor-not-allowed"
            onClick={handleUpdatePrivateMintCharge}
          >
            Update
          </button>
        </div>
      </div>
      <div className="my-4 bg-gray-200 rounded p-4 relative">
        {!!publicMintChargeBgProc && (
          <div className="absolute right-5 top-5 z-10 scale-150">
            <LoaderIcon />
          </div>
        )}
        <label className="font-bold">Public Mint Charge</label>
        <div className="flex items-center gap-4">
          <input
            className="w-full rounded bg-gray-100 h-14 p-3 focus:bg-white transition-colors"
            type="number"
            step={0.00001}
            disabled={!!publicMintChargeBgProc}
            min={0}
            value={configSet.publicMintCharge}
            onChange={(e) =>
              setConfigSet((c) => ({
                ...c,
                publicMintCharge: e.target.valueAsNumber,
              }))
            }
          />
          <button
            disabled={!!publicMintChargeBgProc}
            className="rounded bg-blue-500 text-white p-2 w-40 hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:text-gray-400"
            onClick={handleUpdatePublicMintCharge}
          >
            Update
          </button>
        </div>
      </div>
      <div className="my-4 bg-gray-200 rounded p-4 relative">
        {!!privateMintLimitBgProc && (
          <div className="absolute right-5 top-5 z-10 scale-150">
            <LoaderIcon />
          </div>
        )}
        <label className="font-bold">Private Mint Max Limit</label>
        <div className="flex items-center gap-4">
          <input
            className="w-full rounded bg-gray-100 h-14 p-3 focus:bg-white transition-colors"
            type="number"
            disabled={!!privateMintLimitBgProc}
            min={0}
            value={privateMintLimit}
            onChange={(e) => setPrivateMintLimit(e.target.valueAsNumber)}
          />
          <button
            disabled={!!privateMintLimitBgProc}
            className="rounded bg-blue-500 text-white p-2 w-40 hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:text-gray-400"
            onClick={handleUpdatePrivateMintMaxLimit}
          >
            Update
          </button>
        </div>
      </div>
      <div className="my-4 bg-gray-200 rounded p-4 relative">
        {!!publicMintLimitBgProc && (
          <div className="absolute right-5 top-5 z-10 scale-150">
            <LoaderIcon />
          </div>
        )}
        <label className="font-bold">Public Mint Max Limit</label>
        <div className="flex items-center gap-4">
          <input
            className="w-full rounded bg-gray-100 h-14 p-3 focus:bg-white transition-colors"
            type="number"
            disabled={!!publicMintLimitBgProc}
            min={0}
            value={publicMintLimit}
            onChange={(e) => setPublicMintLimit(e.target.valueAsNumber)}
          />
          <button
            disabled={!!publicMintLimitBgProc}
            className="rounded bg-blue-500 text-white p-2 w-40 hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:text-gray-400"
            onClick={handleUpdatePublicMintMaxLimit}
          >
            Update
          </button>
        </div>
      </div>
      <div className="bg-gray-200 p-4 rounded relative">
        {!!whitelistBgProc && (
          <div className="absolute right-5 top-5 z-10 scale-150">
            <LoaderIcon />
          </div>
        )}
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
          <button
            disabled={!!whitelistBgProc}
            className="rounded bg-blue-500 text-white p-2 w-full hover:bg-blue-700 transition-colors mt-4 disabled:bg-blue-400 disabled:text-gray-400 disabled:cursor-not-allowed"
            onClick={handleUpdateWhitelist}
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

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

export default SettingsSection;
