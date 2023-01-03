import assert from "assert";
import axios from "axios";
import Cookies from "cookies";
import { prisma } from "../lib/db";
import roleIntegrations from "../pages/api/v1/projects/role-integrations";
import { ISaleConfigInput } from "../types";
import { getCookieWallet } from "./auth.service";
import { getDiscordClient, getUserByAccessToken } from "./discord.service";
import { getUserByWalletAddress } from "./user.service";
import { Collection721__factory } from "../ContractFactory";
import { BigNumber, ethers } from "ethers";
import { RPC_URLS } from "../constants/RPC_URL";

export const getAllProjects = async () => await prisma.project.findMany();

export const getAllProjectsByDiscordId = async (
  username: string,
  discriminator: string
) =>
  await prisma.project.findMany({
    where: {
      owner: {
        discordUsername: username,
        discordDiscriminator: +discriminator,
      },
    },
  });

export const getAllProjectByOwnerAddress = async (address: string) => {
  return await prisma.project.findMany({
    where: { owner: { walletAddress: address } },
  });
};

export const getProjectByChainAddress = async (
  address: string,
  chainId: number,
  skip: number,
  take: number,
  status: "all" | "minted" | "unminted"
) => {
  return await prisma.project.findFirst({
    where: { address, chainId },
    include: {
      nfts: {
        include: { properties: true },
        skip,
        take,
        where:
          status === "minted"
            ? { tokenId: { not: null } }
            : status === "unminted"
            ? { tokenId: { equals: null } }
            : {},
      },
      owner: true,
      _count: { select: { nfts: true } },
      roleIntegrations: { orderBy: { id: "asc" } },
    },
  });
};

export const getClaimedSupplyCountByProjectChainAddress = async (
  address: string,
  chainId: number
) => {
  const rpcUrl = RPC_URLS[chainId];
  if (!rpcUrl) return 0;
  const contract = Collection721__factory.connect(
    address,
    new ethers.providers.StaticJsonRpcProvider(rpcUrl)
  );
  const tokenId = await contract.tokenId().catch(() => BigNumber.from(1));
  return tokenId.sub(1).toNumber();
  return await prisma.nFT.count({
    where: { project: { address, chainId }, tokenId: { not: null } },
  });
};
export const getTotalSupplyCountByProjectChainAddress = async (
  address: string,
  chainId: number
) => {
  return await prisma.nFT.count({
    where: { project: { address, chainId } },
  });
};

// export const getUnclaimedSupplyCountByProjectChainAddress = async (
//   address: string,
//   chainId: number
// ) => {
//   return await prisma.nFT.count({
//     where: { project: { address, chainId }, tokenId: null },
//   });
// };

export const addNewProject = async (
  name: string,
  address: string,
  description: string,
  imageUrl: string,
  unrevealedImageUrl: string,
  saleConfigs: ISaleConfigInput[],
  userId: number,
  chainId: number,
  collectionType: string,
  uid: string,
  royaltyReceiver: string,
  royaltyPercentage: number
) => {
  return await prisma.project.create({
    data: {
      name,
      userId,
      address,
      description,
      imageUrl,
      unrevealedImageUrl,
      chainId,
      collectionType,
      uid,
      royaltyPercentage,
      royaltyReceiver,
      saleConfigs: {
        createMany: {
          skipDuplicates: true,
          data: saleConfigs.map((c) => ({
            enabled: c.enabled,
            startTime: c.startTime,
            endTime: c.endTime,
            maxMintInSale: c.maxMintInSale,
            maxMintPerWallet: c.maxMintPerWallet,
            mintCharge: c.mintCharge,
            whitelist: c.whitelistAddresses,
            saleIdentifier: c.uuid,
            saleType: c.saleType,
            tokenGatedAddress: c.tokenGatedAddress,
          })),
        },
      },
    },
  });
};

export const createProjectForCookieWalletUser = async (
  name: string,
  address: string,
  description: string,
  imageUrl: string,
  unrevealedImageUrl: string,
  saleConfigs: ISaleConfigInput[],
  chainId: number,
  collectionType: string,
  signerAddress: string,
  uid: string,
  royaltyReceiver: string,
  royaltyPercentage: number,
  cookies: Cookies
) => {
  const cookieWallet = getCookieWallet(cookies);
  assert(cookieWallet === signerAddress, "signer is not logged in");
  const dbUser = await prisma.user.findFirst({
    where: { walletAddress: cookieWallet },
  });
  assert(!!dbUser, "User Sign Wallet Required");
  return await addNewProject(
    name,
    address,
    description,
    imageUrl,
    unrevealedImageUrl,
    saleConfigs,
    dbUser.id,
    chainId,
    collectionType,
    uid,
    royaltyReceiver,
    royaltyPercentage
  );
};

// export const createProjectForLoggedInUser = async (
//   name: string,
//   address: string,
//   description: string,
//   imageUrl: string,
//   whitelist: string[],
//   accessToken: string,
//   chainId: number,
//   collectionType: string
// ) => {
//   const user = await getUserByAccessToken(accessToken);
//   if (!user) throw "User not logged in";
//   const dbUser = await getUserByDiscordIdentifiers(
//     user.username,
//     user.discriminator
//   );
//   if (!dbUser) throw "User not found in db";
//   const newProject = await addNewProject(
//     name,
//     address,
//     description,
//     imageUrl,
//     dbUser.id,
//     whitelist,
//     chainId,
//     collectionType
//   );
//   return newProject;
// };

export const getAllProjectsOfLoggedInDiscordUser = async (
  accessToken: string
) => {
  const user = await getUserByAccessToken(accessToken);
  if (user) return getAllProjectsByDiscordId(user.username, user.discriminator);
  return null;
};

export const updateProjectOwner = async (
  projectAddress: string,
  projectChainId: number,
  ownerAddress: string
) => {
  return await prisma.project.update({
    where: {
      address_chainId: { address: projectAddress, chainId: projectChainId },
    },
    data: {
      owner: {
        connectOrCreate: {
          where: { walletAddress: ownerAddress },
          create: { walletAddress: ownerAddress },
        },
      },
    },
  });
};

export const getProjectById = async (id: number) => {
  return await prisma.project.findFirstOrThrow({
    where: { id },
    include: { owner: true },
  });
};

export const updateProjectById = async (
  id: number,
  address: string,
  chainId: number,
  collectionType: string,
  description: string,
  imageUrl: string,
  unrevealedImageUrl: string,
  bannerUrl: string,
  name: string,
  userId: number,
  uid: string,
  royaltyReceiver: string,
  royaltyPercentage: number,
  cookies: Cookies
) => {
  const cookieAddress = getCookieWallet(cookies);
  const project = await prisma.project.findFirstOrThrow({
    where: { id },
    select: { owner: true },
  });
  if (project.owner.walletAddress !== cookieAddress)
    throw "Logged in wallet is not project owner";
  return await prisma.project.update({
    where: { id },
    data: {
      address,
      chainId,
      collectionType,
      description,
      imageUrl,
      unrevealedImageUrl,
      bannerUrl,
      name,
      userId,
      uid,
      royaltyPercentage,
      royaltyReceiver,
    },
  });
};

export const projectExistsWithUid = async (uid: string) => {
  return (await prisma.project.count({ where: { uid } })) > 0;
};

export const getProjectByUid = async (uid: string) => {
  return await prisma.project.findFirst({
    where: { uid },
    include: {
      // nfts: true,
      owner: true,
    },
  });
};

export const getProjectsWithValidUid = async () => {
  return await prisma.project.findMany({ where: { uid: { not: null } } });
};

export const getProjectMetadata = async (
  address: string,
  chainId: number,
  royaltyBasis: number | undefined
) => {
  const project = await prisma.project.findFirst({
    where: { address: { mode: "insensitive", equals: address }, chainId },
    include: { owner: true },
  });
  if (!project)
    return {
      name: "",
      description: "",
      image: "",
      external_link: "",
      fee_recipient: "",
    };
  return {
    name: project.name,
    description: project.description,
    image: project.imageUrl,
    external_link: project.uid,
    seller_fee_basis_points:
      royaltyBasis || +(project.royaltyPercentage * 100).toFixed(0),
    // fee_recipient: project.royaltyReceiver || project.owner.walletAddress,
    fee_recipient: address,
  };
};

export const addRoleIntegrationToProject = async (
  projectId: number,
  guildId: string,
  roleId: string,
  minValidNfts: number,
  cookies: Cookies
) => {
  const cookieWallet = getCookieWallet(cookies);
  const dbUser = await getUserByWalletAddress(cookieWallet);
  if (!dbUser) throw "Sign Required";
  return await prisma.roleIntegration.upsert({
    create: { guildId, minValidNfts, roleId, userId: dbUser.id, projectId },
    where: { projectId_guildId_roleId: { guildId, projectId, roleId } },
    update: { minValidNfts },
  });
};

export const getRoleIntegrationsByProjectId = async (projectId: number) =>
  await prisma.roleIntegration.findMany({ where: { projectId } });

export const getDetailedRoleIntegrationsByProjectId = async (
  projectId: number
) => {
  const roleIntegrations = await prisma.roleIntegration.findMany({
    where: { projectId },
  });
  return await Promise.all(
    roleIntegrations.map(async (ri) => {
      const { guildId, id, minValidNfts, roleId, userId } = ri;
      const guild = await (await getDiscordClient()).guilds.fetch(guildId);
      const role = await guild.roles.fetch(roleId);
      if (!role) throw "Invalid role";
      return {
        id,
        guild: { id: guildId, name: guild.name },
        role: { id: roleId, name: role.name },
        minValidNfts,
        projectId,
        addedByUserId: userId,
      };
    })
  );
};

export const deleteRoleIntegrationById = async (id: number) =>
  await prisma.roleIntegration.delete({ where: { id } });

export const deleteProject = async (id: number) => {
  // await prisma.nFT.deleteMany({ where: { projectId: id } });
  // console.log({ deleteProject: "NFTS deleted", id });
  await prisma.project.delete({ where: { id } });
  console.log({ deleteProject: "Project deleted", id });
  await axios
    .get("http://54.153.49.223:4200/restart")
    .then((res) => res.data)
    .then(console.log)
    .catch(console.error);
};
