import { useEthers } from "@usedapp/core";
import { getDefaultProvider } from "ethers";
import { isAddress } from "ethers/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import toast, { LoaderIcon } from "react-hot-toast";
import { v4 } from "uuid";
import { RPC_URLS } from "../../constants/RPC_URL";
import {
  Collection1155__factory,
  Collection721__factory,
} from "../../ContractFactory";
import useDebounce from "../../hooks/useDebounce";
import { uploadFileToFirebase } from "../../lib/firebase";
import { service } from "../../service";
import { DiscordUserResponse, IDeployConfigSet, IGuild } from "../../types";

const SettingsSection = ({
  projectId,
  projectAddress,
  projectChainId,
  collectionType,
  projectOwner,
  serverList,
  discordUser,
}: {
  projectId: number;
  projectChainId: number | null;
  projectAddress: string | null;
  collectionType: string | null;
  projectOwner: string | null;
  serverList: IGuild[] | null;
  discordUser: DiscordUserResponse | null;
}) => {
  const { account, library, chainId } = useEthers();
  const router = useRouter();
  const [basicDataBgProc, setBasicDataBgProc] = useState(0);
  const [feeAddressBgProc, setFeeAddressBgProc] = useState(0);
  const [baseURIBgProc, setBaseURIBgProc] = useState(0);
  const [maxMintInTotalPerWalletBgProc, setMaxMintInTotalPerWalletBgProc] =
    useState(0);
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
    maxMintInTotalPerWallet: 0,
    collectionType: collectionType === "721" ? "721" : "1155",
  });
  console.log(serverList);

  const [imageBase64Logo, setImageBase64Logo] = useState("");
  const logoImgInputRef = useRef<HTMLInputElement | null>(null);
  const [imageBase64Banner, setImageBase64Banner] = useState("");
  const bannerImgInputRef = useRef<HTMLInputElement | null>(null);
  const [currentUid, setCurrentUid] = useState("");
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
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
        // const contract = new Contract(
        //   projectAddress,
        //   collectionType === "721" ? ABI721 : ABI1155,
        //   getDefaultProvider(RPC_URLS[projectChainId])
        // );
        const contract =
          collectionType === "721"
            ? Collection721__factory.connect(
                projectAddress,
                getDefaultProvider(RPC_URLS[projectChainId])
              )
            : Collection1155__factory.connect(
                projectAddress,
                getDefaultProvider(RPC_URLS[projectChainId])
              );
        setFeeAddressBgProc((v) => v + 1);
        setMaxMintInTotalPerWalletBgProc((v) => v + 1);
        setBaseURIBgProc((v) => v + 1);
        const [
          feeToAddress,
          curi,
          baseURI,
          maxMintInTotalPerWallet,
          token0uri,
        ] = await Promise.all([
          contract.feeDestination(),
          contract.contractURI(),
          contract.baseURI(),
          contract.maxMintInTotalPerWallet(),
          contract.tokenURI(0),
        ]);
        console.log({ curi, token0uri });

        setConfigSet((c) => ({
          ...c,
          feeToAddress,
          baseURI,
          maxMintInTotalPerWallet: +maxMintInTotalPerWallet.toString(),
        }));
        setFeeAddressBgProc((v) => v - 1);
        setBaseURIBgProc((v) => v - 1);
        setMaxMintInTotalPerWalletBgProc((v) => v - 1);
      })();
    } catch (error) {
      setMaxMintInTotalPerWalletBgProc((v) => v - 1);
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
      const contract =
        collectionType === "721"
          ? new Collection721__factory(library.getSigner(account)).attach(
              projectAddress
            )
          : new Collection1155__factory(library.getSigner(account)).attach(
              projectAddress
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

  const handleMaxMintInTotalUpdate = async () => {
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

    const contract =
      collectionType === "721"
        ? new Collection721__factory(library.getSigner(account)).attach(
            projectAddress
          )
        : new Collection1155__factory(library.getSigner(account)).attach(
            projectAddress
          );
    try {
      setMaxMintInTotalPerWalletBgProc((v) => v + 1);
      const tx = await toast.promise(
        contract.updateMaxMintInTotalPerWallet(
          configSet.maxMintInTotalPerWallet
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
      setMaxMintInTotalPerWalletBgProc((v) => v - 1);
    } catch (error) {
      setMaxMintInTotalPerWalletBgProc((v) => v - 1);
      console.log("Error updating max mint in total : ", error);
      toast.error("Error updating max mint in total");
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
    const contract =
      collectionType === "721"
        ? new Collection721__factory(library.getSigner(account)).attach(
            projectAddress
          )
        : new Collection1155__factory(library.getSigner(account)).attach(
            projectAddress
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

  const selectedGuild = useMemo(() => {
    if (serverList === null || selectedServer === null) return null;
    const server = serverList.find((s) => s.guild.id === selectedServer);
    return !server ? null : server;
  }, [selectedServer, serverList]);

  const selectedGuildRole = useMemo(() => {
    if (selectedGuild === null || selectedRole === null) return null;
    const role = selectedGuild.guildRoles.find((r) => r.id === selectedRole);
    return !role ? null : role;
  }, [selectedGuild, selectedRole]);

  const selectedServerGuildMember = useMemo(() => {
    if (selectedGuild === null || discordUser === null) return null;
    const member = selectedGuild.members.find((m) => m.id === discordUser.id);
    return !member ? null : member;
  }, [discordUser, selectedGuild]);

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
            href={`https://gogomint.ashrhmn.com/mint/${configSet.uid}`}
            passHref
          >
            <div className="text-lg mt-7 border-2 border-gray-300 rounded text-left px-4 cursor-pointer hover:text-blue-500 transition-colors break-all">{`🌐 https://gogomint.ashrhmn.com/mint/${
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
                <p className="text-sm text-gray-500">Name of the project</p>
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
              <p className="text-sm text-gray-500">
                Description of the project
              </p>
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
              <p className="text-sm text-gray-500">
                This UID is set as the project mint page URL. See preview above
                for reference.
              </p>
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
              <p className="text-sm text-gray-500">
                On every resale of an NFT from this collection a
                RoyaltyPercentage will be sent to this address
              </p>
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
                    defaultValue={configSet.roayltyPercentage}
                    placeholder="0"
                    onChange={(e) =>
                      setConfigSet((p) => ({
                        ...p,
                        roayltyPercentage:
                          isNaN(e.target.valueAsNumber) || e.target.value === ""
                            ? 0
                            : +e.target.valueAsNumber.toFixed(2) > 10
                            ? 10
                            : +e.target.valueAsNumber.toFixed(2),
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
          <label className="font-bold">Charge Recipient Address</label>
          <p className="text-sm text-gray-500">
            All the mint charges will go to this address (Requires Transaction
            on update)
          </p>
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
        {!!maxMintInTotalPerWalletBgProc && (
          <div className="absolute right-5 top-5 z-10 scale-150">
            <LoaderIcon />
          </div>
        )}
        <div className="mt-4 space-y-2">
          <label className="font-bold">Max Mint Per Wallet in Total</label>
          <p className="text-sm text-gray-500">
            Max mint limit for a wallet in this collection (Requires Transaction
            on update)
          </p>
          <input
            className="w-full rounded bg-gray-100 h-14 p-3 focus:bg-white transition-colors"
            type="number"
            disabled={!!maxMintInTotalPerWalletBgProc}
            placeholder="Unlimited"
            value={configSet.maxMintInTotalPerWallet || ""}
            onChange={(e) =>
              setConfigSet((c) => ({
                ...c,
                maxMintInTotalPerWallet:
                  isNaN(+e.target.value) || e.target.value === ""
                    ? 0
                    : +e.target.valueAsNumber.toFixed(0),
              }))
            }
          />
        </div>
        <div>
          <button
            disabled={!!maxMintInTotalPerWalletBgProc}
            className="rounded bg-blue-500 text-white p-2 w-full hover:bg-blue-700 transition-colors mt-4 disabled:bg-blue-400 disabled:text-gray-400 disabled:cursor-not-allowed"
            onClick={handleMaxMintInTotalUpdate}
          >
            Update
          </button>
        </div>
      </div>
      <div className="bg-gray-200 rounded p-4 my-6 relative">
        <div className="mt-4 space-y-2">
          <label className="font-bold">Set Discord Roles</label>
          <p className="text-sm text-gray-500">
            Here you can set discord roles to be assigned to NFT holders from
            this project
          </p>
          <Link
            target="_blank"
            href={`https://discord.com/oauth2/authorize?client_id=990705597953474590&scope=bot%20applications.commands&permissions=268435456`}
            passHref
          >
            <a>Add VerifyBot to you server</a>
          </Link>
          {(serverList === null || discordUser === null) && (
            <h1>
              Make sure to be log in from{" "}
              <Link href={`/authenticate`} passHref>
                <a>Authenticate</a>
              </Link>{" "}
              Page
            </h1>
          )}
          {serverList !== null && discordUser !== null && (
            <div>
              <h1>
                VerifyBot is added to {serverList.length} Discord Server(s) that
                you are member of
              </h1>
              <div>
                <label>Select Server</label>
                <select
                  onChange={(e) =>
                    setSelectedServer(
                      e.target.value !== "select" ? e.target.value : null
                    )
                  }
                >
                  <option value="select">Select</option>
                  {serverList.map((s) => (
                    <option
                      // disabled={!s.botCanManageRole}
                      key={s.guild.id}
                      value={s.guild.id}
                    >
                      {s.guild.name}{" "}
                      {!s.botCanManageRole &&
                        "(Add the bot again with default permissions)"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Select Role</label>
                <select
                  onChange={(e) =>
                    setSelectedRole(
                      e.target.value !== "select" ? e.target.value : null
                    )
                  }
                >
                  {selectedGuild === null && (
                    <option value={"select"}>Select a server</option>
                  )}
                  {selectedGuild !== null &&
                    selectedGuild.guildRoles.map((role) => (
                      <option value={role.id} key={role.id}>
                        {role.name}
                      </option>
                    ))}
                  {selectedGuild !== null &&
                    selectedGuild.guildRoles.length === 0 && (
                      <option value={"select"}>No roles found</option>
                    )}
                </select>
              </div>
              <div>
                <h1>{selectedServer}</h1>
                <h1>{selectedRole}</h1>
                {selectedServerGuildMember !== null && (
                  <>
                    <h1>
                      Has Admin Rights :{" "}
                      {selectedServerGuildMember.isAdmin ? "Yes" : "No"}
                    </h1>
                    <h1>
                      Can Manage Roles :{" "}
                      {selectedServerGuildMember.canManageRole ? "Yes" : "No"}
                    </h1>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <details>
        <summary className="text-xl font-medium cursor-pointer">
          Advance Settings
          <p className="text-sm text-gray-500">
            Only change when you know what you are doing
          </p>
        </summary>
        <div className="bg-gray-200 rounded p-4 my-6 relative">
          {!!baseURIBgProc && (
            <div className="absolute right-5 top-5 z-10 scale-150">
              <LoaderIcon />
            </div>
          )}
          <div className="mt-4 space-y-2">
            <label className="font-bold">Base URI</label>
            <p className="text-sm text-gray-500">
              Base URL for token and contract metadata (Requires Transaction on
              update)
            </p>
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
      </details>
      {/* <iframe
        className="w-full h-[600px] border-2 border-gray-500 rounded-xl"
        src={`https://gogomint.ashrhmn.com/mint/${configSet.uid}`}
        frameBorder="0"
      ></iframe> */}
    </div>
  );
};

export default SettingsSection;
