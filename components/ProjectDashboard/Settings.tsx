import ReactPlayer from "react-player";
import { RoleIntegration } from "@prisma/client";
import { useEthers } from "@usedapp/core";
import { providers } from "ethers";
import { isAddress } from "ethers/lib/utils";
import Image from "next/image";
import { useRouter } from "next/router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import {
  formatHtmlDateTime,
  getUrlFileExtension,
} from "../../utils/String.utils";

const SettingsSection = ({
  projectId,
  projectAddress,
  projectChainId,
  collectionType,
  projectOwner,
  roleIntegrations: initialRoleIntegrations,
}: {
  projectId: number;
  projectChainId: number | null;
  projectAddress: string | null;
  collectionType: string | null;
  projectOwner: string | null;
  roleIntegrations: RoleIntegration[];
}) => {
  const { account, library, chainId } = useEthers();
  const router = useRouter();
  const [basicDataBgProc, setBasicDataBgProc] = useState(0);
  const [feeAddressBgProc, setFeeAddressBgProc] = useState(0);
  const [baseURIBgProc, setBaseURIBgProc] = useState(0);
  const [revealTimeBgProc, setRevealTimeBgProc] = useState(0);
  const [maxMintInTotalPerWalletBgProc, setMaxMintInTotalPerWalletBgProc] =
    useState(0);
  const [isUidUnavailable, setIsUidUnavailable] = useState(false);
  const [minValidNfts, setMinValidNfts] = useState(0);

  const [roleIntegrationRefetcher, setRoleIntegrationRefetcher] =
    useState(false);
  const [roleIntegrationBgProc, setRoleIntegrationBgProc] = useState(0);

  const [roleIntegrations, setRoleIntegrations] = useState<RoleIntegration[]>(
    initialRoleIntegrations
  );

  const [discordUser, setDiscordUser] = useState<
    DiscordUserResponse | null | undefined
  >(undefined);

  const [serverList, setServerList] = useState<IGuild[] | null | undefined>(
    undefined
  );

  const [serverlistRefetcher, setServerlistRefetcher] = useState(false);
  const [discordUserRefetcher, setDiscordUserRefetcher] = useState(false);

  useEffect(() => {
    setDiscordUser(undefined);
    service
      .get(`auth/discord/current-user`)
      .then((res) => res.data)
      .then((r) => r.data)
      .then(setDiscordUser)
      .catch(() => {
        // console.error("Error getting discord user : ", error);
        setDiscordUser(null);
      });
  }, [discordUserRefetcher]);

  useEffect(() => {
    setServerList(undefined);
    service
      .get(`discord/server-list`)
      .then((res) => res.data)
      .then((r) => r.data)
      .then(setServerList)
      .catch(() => {
        // console.error("Error getting server list", error);
        setServerList(null);
      });
  }, [serverlistRefetcher]);

  const getGuildNameById = useCallback(
    (id: string) => {
      if (serverList === null) return undefined;
      const guild = !serverList
        ? undefined
        : serverList.map((s) => s.guild).find((g) => g.id === id);
      return !!guild ? guild.name : undefined;
    },
    [serverList]
  );

  const getRoleNameById = useCallback(
    (id: string) => {
      if (serverList === null || !serverList) return undefined;
      const role = serverList
        .map((s) => s.guildRoles)
        .reduce((prev, current) => [...prev, ...current], [])
        .find((r) => r.id === id);
      return !!role ? role.name : undefined;
    },
    [serverList]
  );

  useEffect(() => {
    (async () => {
      setRoleIntegrationBgProc((v) => v + 1);
      await service
        .get(`/projects/role-integrations?projectId=${projectId}`)
        .then((res) =>
          (res.data.data as RoleIntegration[]).sort((a, b) =>
            a.id > b.id ? 1 : a.id < b.id ? -1 : 0
          )
        )
        .then(setRoleIntegrations)
        .catch((err) => {
          setRoleIntegrationBgProc((v) => v - 1);
          toast.error("Error fetching role integrations");
          console.log("Error fetching role integrations : ", err);
        });
      setRoleIntegrationBgProc((v) => v - 1);
    })();
  }, [projectId, roleIntegrationRefetcher]);

  const [configSet, setConfigSet] = useState<
    IDeployConfigSet & { baseURI: string }
  >({
    name: "",
    description: "",
    feeToAddress: "",
    logo: null,
    unrevealedImage: null,
    banner: null,
    symbol: "",
    uid: "",
    saleWaves: [],
    baseURI: "",
    roayltyPercentage: 0,
    roayltyReceiver: "",
    maxMintInTotalPerWallet: 0,
    collectionType: collectionType === "721" ? "721" : "1155",
    revealTime: 0,
    maxLimitCap: 0,
  });

  const [imageBase64Logo, setImageBase64Logo] = useState("");
  const logoImgInputRef = useRef<HTMLInputElement | null>(null);
  const unrevealedImgInputRef = useRef<HTMLInputElement | null>(null);
  const [imageBase64Banner, setImageBase64Banner] = useState("");
  const [imageBase64UnrevealedImage, setImageBase64UnrevealedImage] =
    useState("");
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
  const onSelectUnrevealedImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target && typeof ev.target.result === "string") {
        setImageBase64UnrevealedImage(ev.target.result);
        console.log(ev.target.result);

        console.log("IF");
      }
    };
    reader.readAsDataURL(file);
    setConfigSet((c) => ({ ...c, unrevealedImage: file }));
  };
  useEffect(() => {
    try {
      (async () => {
        if (!projectAddress || !projectChainId || !RPC_URLS[projectChainId])
          return;
        const contract =
          collectionType === "721"
            ? Collection721__factory.connect(
                projectAddress,
                new providers.StaticJsonRpcProvider(RPC_URLS[projectChainId])
              )
            : Collection1155__factory.connect(
                projectAddress,
                new providers.StaticJsonRpcProvider(RPC_URLS[projectChainId])
              );
        setFeeAddressBgProc((v) => v + 1);
        setMaxMintInTotalPerWalletBgProc((v) => v + 1);
        setBaseURIBgProc((v) => v + 1);

        const {
          feeDestination: feeToAddress,
          baseURI,
          maxMintInTotalPerWallet,
          revealTime,
        } = await contract.state();
        const curi = await contract.contractURI();
        console.log({ curi, baseURI });

        setConfigSet((c) => ({
          ...c,
          feeToAddress,
          baseURI,
          maxMintInTotalPerWallet: +maxMintInTotalPerWallet.toString(),
          revealTime: revealTime.toNumber(),
        }));
        setFeeAddressBgProc((v) => v - 1);
        setBaseURIBgProc((v) => v - 1);
        setMaxMintInTotalPerWalletBgProc((v) => v - 1);
      })();
    } catch (error) {
      setMaxMintInTotalPerWalletBgProc((v) => v - 1);
      setBaseURIBgProc((v) => v - 1);
      setFeeAddressBgProc((v) => v - 1);
      console.log("Error fetching : ", error);
    }
  }, [collectionType, projectAddress, projectChainId]);

  useEffect(() => {
    try {
      (async () => {
        if (projectId) {
          setBasicDataBgProc((v) => v + 1);
          const project = await service
            .get(`/projects/${projectId}`)
            .then((res) => res.data);
          // console.log(project);
          if (project.error) {
            console.log(project.error);
            return;
          }
          setImageBase64Logo(project.data.imageUrl);
          setImageBase64Banner(project.data.bannerUrl);
          setImageBase64UnrevealedImage(project.data.unrevealedImageUrl);
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

  const handleUpdateUnrevealedImage = async () => {
    try {
      if (!configSet.unrevealedImage) return;
      setBasicDataBgProc((v) => v + 1);
      const url = await toast.promise(
        uploadFileToFirebase(configSet.unrevealedImage),
        {
          error: "Error uploading",
          loading: "Uploading Image...",
          success: "Uploaded successfully",
        }
      );
      if (!url) return;

      await toast.promise(
        service.put(`/projects/${projectId}`, {
          unrevealedImageUrl: url,
        }),
        {
          error: "Error updating Unrevealed NFT Image",
          loading: "Updating Unrevealed NFT Image...",
          success: "Updated successfully",
        }
      );
      // setBasicDataBgProc((v) => v - 1);
      router.reload();
    } catch (error) {
      toast.error("Error updatin unrevealed image");
      console.log(error);
      setBasicDataBgProc((v) => v - 1);
    }
  };
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

  const handleRevealTimeUpdate = async () => {
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
      setRevealTimeBgProc((v) => v + 1);
      const tx = await toast.promise(
        contract.updateRevealTime(configSet.revealTime),
        {
          error: "Error sending transaction",
          loading: "Sending transaction...",
          success: "Transaction sent",
        }
      );
      await toast.promise(tx.wait(), {
        error: "Mining failed",
        loading: "Mining transaction...",
        success: "Transaction Completed",
      });
      setRevealTimeBgProc((v) => v - 1);
    } catch (error) {
      setRevealTimeBgProc((v) => v - 1);
      console.log("Error updating Reveal Time : ", error);
      toast.error("Error updating Reveal Time");
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
      // setBaseURIBgProc((v) => v + 1);
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
      // setBaseURIBgProc((v) => v - 1);
    } catch (error) {
      // setBaseURIBgProc((v) => v - 1);
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
    if (serverList === null || !serverList || selectedServer === null)
      return null;
    const server = serverList.find((s) => s.guild.id === selectedServer);
    return !server ? null : server;
  }, [selectedServer, serverList]);

  const selectedGuildRole = useMemo(() => {
    if (selectedGuild === null || selectedRole === null) return null;
    const role = selectedGuild.guildRoles.find((r) => r.id === selectedRole);
    return !role ? null : role;
  }, [selectedGuild, selectedRole]);

  const selectedServerGuildMember = useMemo(() => {
    if (selectedGuild === null || !discordUser || discordUser === null)
      return null;
    const member = selectedGuild.members.find((m) => m.id === discordUser.id);
    return !member ? null : member;
  }, [discordUser, selectedGuild]);

  const handleSaveRoleIntegration = async () => {
    try {
      if (selectedGuild === null) throw "No server selected";
      if (selectedGuildRole === null) throw "No role selected";
      if (minValidNfts < 1) throw "Min number of NFTs must be at least 1";
      if (selectedServerGuildMember === null)
        throw "Logged in user not found in selected server";
      if (
        !(
          selectedServerGuildMember.isAdmin ||
          selectedServerGuildMember.canManageRole
        )
      )
        throw "You must have Administrator or Role Manager permission on the selected server";

      // setRoleIntRefetcherBgProc(true);

      setRoleIntegrations((p) =>
        !!p.find(
          (ri) =>
            ri.projectId === projectId &&
            ri.guildId === selectedGuild.guild.id &&
            ri.roleId === selectedGuildRole.id
        )
          ? p.map((ri) =>
              ri.projectId === projectId &&
              ri.roleId === selectedGuildRole.id &&
              ri.guildId === selectedGuild.guild.id
                ? { ...ri, minValidNfts }
                : ri
            )
          : [
              ...p,
              {
                projectId,
                roleId: selectedGuildRole.id,
                guildId: selectedGuild.guild.id,
                minValidNfts,
                id: -11,
                userId: -11,
              },
            ]
      );

      const { data } = await service.post(`/projects/role-integrations`, {
        projectId,
        roleId: selectedGuildRole.id,
        guildId: selectedGuild.guild.id,
        minValidNfts,
      });
      console.log(data);

      setRoleIntegrationRefetcher((v) => !v);

      await service.post(`discord/refresh-role-integrations`, {
        projectAddress,
      });

      // router.replace(router.asPath);
    } catch (error) {
      if (typeof error === "string") toast.error(error);
      console.log(error);
    }
  };

  const handleDeleteRoleIntegration = async (id: number) => {
    setRoleIntegrations((p) => p.filter((ri) => ri.id !== id));
    await service
      .delete(`/projects/role-integrations/${id}`)
      .then((res) => res.data)
      .then(console.log)
      .catch(console.error);
    setRoleIntegrationRefetcher((v) => !v);
    // await service.post(`discord/refresh-role-integrations`, {
    //   projectAddress,
    // });
  };

  return (
    <div className="mt-4">
      <div className="bg-gray-800 p-4 rounded relative overflow-hidden">
        {!!basicDataBgProc && (
          <div className="absolute right-5 top-5 z-10 scale-150">
            <LoaderIcon />
          </div>
        )}
        <div className="absolute top-0 right-0 left-0 text-white0 bg-gray-800 text-3xl font-medium text-center py-1 shadow-2xl z-10">
          <h1>Mint Page Preview</h1>
          <a
            href={`https://mint.hydromint.xyz/${configSet.uid}`}
            target="_blank"
            rel="noreferrer"
          >
            <div className="text-lg mt-7 border-2 border-gray-300 rounded text-left px-4 cursor-pointer hover:text-blue-500 transition-colors break-all">{`🌐 https://mint.hydromint.xyz/${
              configSet.uid.trim().replaceAll(" ", "%20") || "<random-string>"
            }`}</div>
          </a>
        </div>
        <div className="flex flex-col">
          <div className="border-2 border-gray-500 p-4 rounded-2xl">
            <div
              onClick={() => {
                if (bannerImgInputRef && bannerImgInputRef.current)
                  bannerImgInputRef.current.click();
              }}
              className="relative w-full h-60 flex mx-auto justify-center items-center bg-gray-600 rounded cursor-pointer translate-y-16"
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
              className="relative aspect-square w-40 flex mx-auto justify-center items-center bg-gray-700 rounded cursor-pointer shadow-xl"
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
                  priority
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
                <p className="text-sm text-gray-300">Name of the project</p>
              </label>
              <input
                className="w-full rounded bg-gray-700 h-14 p-3 focus:bg-gray-800 transition-colors"
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
              <p className="text-sm text-gray-300">
                Description of the project
              </p>
              <input
                className="w-full rounded bg-gray-700 h-14 p-3 focus:bg-gray-800 transition-colors"
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
              <p className="text-sm text-gray-300">
                This UID is set as the project mint page URL. See preview above
                for reference.
              </p>
              <input
                className="w-full rounded bg-gray-700 h-14 p-3 focus:bg-gray-800 transition-colors"
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
            {/* <div className="mt-4 space-y-2">
              <label className="font-bold">Royalty Receiver</label>
              <p className="text-sm text-gray-300">
                On every resale of an NFT from this collection a
                RoyaltyPercentage will be sent to this address
              </p>
              <div className="flex items-center gap-4">
                <input
                  className="w-full rounded bg-gray-700 h-14 p-3 focus:bg-gray-800 transition-colors"
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
                <div className="flex items-center bg-gray-700 rounded">
                  <input
                    className="rounded bg-gray-700 h-14 p-3 focus:bg-gray-800 transition-colors"
                    type="number"
                    max={10}
                    min={0}
                    step={0.01}
                    value={configSet.roayltyPercentage || ""}
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
            </div> */}
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleUpdateBasic}
            disabled={!!basicDataBgProc}
            className="rounded bg-blue-500 text-white p-2 w-36 hover:bg-blue-700 transition-colors mt-4 disabled:bg-blue-400 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Update
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-stretch sm:gap-4">
        <div className="bg-gray-800 rounded p-4 my-6 relative w-full flex flex-col justify-between">
          {!!revealTimeBgProc && (
            <div className="absolute right-5 top-5 z-10 scale-150">
              <LoaderIcon />
            </div>
          )}
          <div className="mt-4 space-y-2">
            <label className="font-bold">
              Update Metadata Reveal Time{" "}
              <span className="text-xs font-normal">
                ( {new Date().toString().match(/\(([^\)]+)\)$/)?.[1]} )
              </span>
            </label>
            <p className="text-sm text-gray-300">
              Update the time when NFT metadata is revealed (Requires
              Transaction on update)
            </p>
            <input
              className="w-full rounded bg-gray-700 h-14 p-3 focus:bg-gray-800 transition-colors"
              type="datetime-local"
              disabled={!!revealTimeBgProc}
              value={formatHtmlDateTime(new Date(configSet.revealTime * 1000))}
              onChange={(e) =>
                setConfigSet((c) => ({
                  ...c,
                  revealTime: +(+new Date(e.target.value) / 1000).toFixed(0),
                }))
              }
            />
          </div>
          <div className="flex justify-end">
            <button
              disabled={!!revealTimeBgProc}
              className="rounded bg-blue-500 text-white p-2 w-36 hover:bg-blue-700 transition-colors mt-4 disabled:bg-blue-400 disabled:text-gray-400 disabled:cursor-not-allowed"
              onClick={handleRevealTimeUpdate}
            >
              Update
            </button>
          </div>
        </div>
        <div className="bg-gray-800 rounded p-4 my-6 relative w-full flex flex-col justify-between">
          {!!basicDataBgProc && (
            <div className="absolute right-5 top-5 z-10 scale-150">
              <LoaderIcon />
            </div>
          )}
          <div className="mt-4 space-y-2 flex gap-3">
            <div
              onClick={() => {
                if (unrevealedImgInputRef && unrevealedImgInputRef.current)
                  unrevealedImgInputRef.current.click();
              }}
              className="relative aspect-square w-60 flex mx-auto justify-center items-center bg-gray-300 rounded cursor-pointer shadow-xl"
            >
              <input
                ref={unrevealedImgInputRef}
                onChange={onSelectUnrevealedImage}
                type="file"
                hidden
              />
              {!!imageBase64UnrevealedImage ? (
                ["mp4", "avi", "mkv", "wmv"].includes(
                  getUrlFileExtension(imageBase64UnrevealedImage).toLowerCase()
                ) ? (
                  <ReactPlayer
                    height="100%"
                    width="100%"
                    muted
                    playing
                    loop
                    url={imageBase64UnrevealedImage}
                    style={{ position: "absolute", inset: "0" }}
                  />
                ) : (
                  <Image
                    src={imageBase64UnrevealedImage}
                    alt=""
                    layout="fill"
                    objectFit="cover"
                    priority
                  />
                )
              ) : (
                <span className="text-2xl">+</span>
              )}
            </div>
            <div>
              <label className="font-bold">Unrevealed NFT Image</label>
              <p className="text-sm text-gray-300">
                This image will be shown when an NFT has not been revealed yet
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              disabled={!!basicDataBgProc}
              className="rounded bg-blue-500 text-white p-2 w-36 hover:bg-blue-700 transition-colors mt-4 disabled:bg-blue-400 disabled:text-gray-400 disabled:cursor-not-allowed"
              onClick={handleUpdateUnrevealedImage}
            >
              Update
            </button>
          </div>
        </div>
      </div>
      <div className="sm:flex sm:gap-4 w-full">
        <div className="bg-gray-800 rounded p-4 my-6 relative w-full">
          {!!maxMintInTotalPerWalletBgProc && (
            <div className="absolute right-5 top-5 z-10 scale-150">
              <LoaderIcon />
            </div>
          )}
          <div className="mt-4 space-y-2">
            <label className="font-bold">Max Mint Per Wallet in Total</label>
            <p className="text-sm text-gray-300">
              Max mint limit for a wallet in this collection (Requires
              Transaction on update)
            </p>
            <input
              className="w-full rounded bg-gray-700 h-14 p-3 focus:bg-gray-800 transition-colors"
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
          <div className="flex justify-end">
            <button
              disabled={!!maxMintInTotalPerWalletBgProc}
              className="rounded bg-blue-500 text-white p-2 w-36 hover:bg-blue-700 transition-colors mt-4 disabled:bg-blue-400 disabled:text-gray-400 disabled:cursor-not-allowed"
              onClick={handleMaxMintInTotalUpdate}
            >
              Update
            </button>
          </div>
        </div>
        <div className="bg-gray-800 rounded p-4 my-6 relative w-full">
          {!!feeAddressBgProc && (
            <div className="absolute right-5 top-5 z-10 scale-150">
              <LoaderIcon />
            </div>
          )}
          <div className="mt-4 space-y-2">
            <label className="font-bold">Charge Recipient Address</label>
            <p className="text-sm text-gray-300">
              All the mint charges will go to this address (Requires Transaction
              on update)
            </p>
            <input
              className="w-full rounded bg-gray-700 h-14 p-3 focus:bg-gray-800 transition-colors"
              type="text"
              disabled={!!feeAddressBgProc}
              value={configSet.feeToAddress}
              onChange={(e) =>
                setConfigSet((c) => ({ ...c, feeToAddress: e.target.value }))
              }
            />
          </div>
          <div className="flex justify-end">
            <button
              disabled={!!feeAddressBgProc}
              className="rounded bg-blue-500 text-white p-2 w-36 hover:bg-blue-700 transition-colors mt-4 disabled:bg-blue-400 disabled:text-gray-400 disabled:cursor-not-allowed"
              onClick={handleFeetoAddressUpdate}
            >
              Update
            </button>
          </div>
        </div>
      </div>
      <div className="bg-gray-800 rounded p-4 my-6 relative">
        <div className="mt-4">
          <div className="flex flex-col sm:flex-row justify-between mb-5">
            <div>
              <label className="font-bold">
                Set Discord Roles{" "}
                {!!discordUser && (
                  <span className="font-light text-sm">
                    (Logged in as {discordUser.username}#
                    {discordUser.discriminator})
                  </span>
                )}
              </label>
              <p className="text-sm text-gray-300 mt-1 mb-4">
                Here you can set discord roles to be assigned to NFT holders
                from this project
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button
                className="bg-blue-500 text-white hover:bg-blue-700 transition-colors p-2 rounded whitespace-nowrap"
                onClick={() => {
                  setDiscordUserRefetcher((v) => !v);
                  setServerlistRefetcher((v) => !v);
                  setRoleIntegrationRefetcher((v) => !v);
                }}
              >
                Refresh Informations
              </button>
              <a
                className="bg-blue-500 text-white text-center hover:bg-blue-700 transition-colors p-2 rounded"
                target="_blank"
                rel="noreferrer"
                href={`https://discord.com/oauth2/authorize?client_id=990705597953474590&scope=bot%20applications.commands&permissions=268435456`}
              >
                Add VerifyBot
              </a>
            </div>
          </div>
          {(serverList === undefined || discordUser === undefined) && (
            <div className="flex justify-center scale-150">
              <LoaderIcon />
            </div>
          )}
          {(serverList === null || discordUser === null) && (
            <h1 className="mt-3 text-center text-xl">
              You are not logged in with Discord. Make sure to be logged in from{" "}
              <a
                className="text-blue-500 hover:text-blue-600 transition-colors"
                target="_blank"
                rel="noreferrer"
                href={`/authenticate`}
              >
                Authenticate
              </a>{" "}
              Page
            </h1>
          )}
          {!!serverList && discordUser !== null && (
            <div className="mt-3">
              {serverList.length > 0 ? (
                <>
                  <h1>
                    VerifyBot is added to {serverList.length} Discord Server(s)
                    that you are member of
                  </h1>
                  <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="w-full flex gap-2 items-center">
                      <label className="min-w-fit">Select Server</label>
                      <select
                        className="w-full p-1 rounded h-8 bg-gray-700"
                        onChange={(e) =>
                          setSelectedServer(
                            e.target.value !== "select" ? e.target.value : null
                          )
                        }
                      >
                        <option value="select">Select</option>
                        {serverList.map((s) => (
                          <option
                            disabled={!s.botCanManageRole}
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
                    <div className="w-full flex gap-2 items-center">
                      <label className="min-w-fit">Select Role</label>
                      <select
                        className="w-full p-1 rounded h-8 bg-gray-700"
                        onChange={(e) =>
                          setSelectedRole(
                            e.target.value !== "select" ? e.target.value : null
                          )
                        }
                      >
                        <option value={"select"}>Select</option>
                        {selectedGuild !== null &&
                          selectedGuild.guildRoles.map((role) => (
                            <option value={role.id} key={role.id}>
                              {role.name}
                            </option>
                          ))}
                        {selectedGuild !== null &&
                          selectedGuild.guildRoles.length === 0 && (
                            <option disabled value={"select"}>
                              No roles found
                            </option>
                          )}
                      </select>
                    </div>
                    <div className="w-full flex gap-2 items-center">
                      <label className="">
                        Minimum NFTs required for this role
                      </label>
                      <input
                        className="w-full p-1 rounded h-8 bg-gray-700 focus:bg-gray-800"
                        type="number"
                        value={minValidNfts || ""}
                        onChange={(e) =>
                          setMinValidNfts(
                            e.target.value === "" || isNaN(+e.target.value)
                              ? 0
                              : e.target.valueAsNumber
                          )
                        }
                      />
                    </div>
                    <button
                      className="bg-blue-600 text-white hover:bg-blue-700 transition-colors px-3 rounded h-8"
                      onClick={handleSaveRoleIntegration}
                    >
                      Save
                    </button>
                  </div>
                  {selectedServerGuildMember !== null && (
                    <div className="my-2 py-2 text-xl bg-gray-700 rounded">
                      {!!discordUser && !!selectedGuild && (
                        <h1 className="text-center">
                          On server {"'" + selectedGuild.guild.name + "' "}
                          {discordUser.username}#{discordUser.discriminator}
                        </h1>
                      )}
                      <div className="flex justify-around">
                        <h1>
                          Has Admin Rights :{" "}
                          {selectedServerGuildMember.isAdmin ? "Yes" : "No"}
                        </h1>
                        <h1>
                          Can Manage Roles :{" "}
                          {selectedServerGuildMember.canManageRole
                            ? "Yes"
                            : "No"}
                        </h1>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h1 className="text-center">
                    VerifyBot is not added to any Discord Server that you are
                    member of, you can always{" "}
                    <a
                      className="text-blue-500 text-center hover:text-blue-700 transition-colors"
                      target="_blank"
                      rel="noreferrer"
                      href={`https://discord.com/oauth2/authorize?client_id=990705597953474590&scope=bot%20applications.commands&permissions=268435456`}
                    >
                      Add VerifyBot to your server
                    </a>
                  </h1>
                </>
              )}
            </div>
          )}
        </div>
        {!!discordUser && !!serverList && (
          <div className="mt-4 space-y-2 relative">
            {!!roleIntegrationBgProc && (
              <div className="absolute right-5 top-20 z-10 scale-150">
                <LoaderIcon />
              </div>
            )}
            <label className="font-bold">Existing Rules</label>
            <p className="text-sm text-gray-300">
              These are the rules for discord roles added from this project
            </p>
            {roleIntegrations.length === 0 && (
              <h1 className="text-center text-xl">
                No integration is currently set for this project
              </h1>
            )}
            {roleIntegrations.length > 0 && (
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-center p-2 border-2 border-gray-400">
                      Server
                    </th>
                    <th className="text-center p-2 border-2 border-gray-400">
                      Role
                    </th>
                    <th className="text-center p-2 border-2 border-gray-400">
                      Min NFT
                    </th>
                    <th className="text-center p-2 border-2 border-gray-400">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {roleIntegrations.map((ri) => (
                    <tr key={ri.id}>
                      <td className="text-center p-2 border-2 border-gray-400">
                        {getGuildNameById(ri.guildId) || ri.guildId}
                      </td>
                      <td className="text-center p-2 border-2 border-gray-400">
                        {getRoleNameById(ri.roleId) || ri.roleId}
                      </td>
                      <td className="text-center p-2 border-2 border-gray-400">
                        {ri.minValidNfts}
                      </td>
                      <td className="text-center p-2 border-2 border-gray-400">
                        <button
                          className="text-red-400 hover:text-red-600 transition-colors"
                          onClick={() => handleDeleteRoleIntegration(ri.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      <details>
        <summary className="text-xl font-medium cursor-pointer">
          Advance Settings
          <p className="text-sm text-gray-300">
            Only change when you know what you are doing
          </p>
        </summary>
        <div className="bg-gray-800 rounded p-4 my-6 relative">
          {!!baseURIBgProc && (
            <div className="absolute right-5 top-5 z-10 scale-150">
              <LoaderIcon />
            </div>
          )}
          <div className="mt-4 space-y-2">
            <label className="font-bold">Base URI</label>
            <p className="text-sm text-gray-300">
              Base URL for token and contract metadata (Requires Transaction on
              update)
            </p>
            <input
              className="w-full rounded bg-gray-700 h-14 p-3 focus:bg-gray-800 transition-colors"
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
    </div>
  );
};

export default SettingsSection;
