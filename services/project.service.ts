import assert from "assert";
import Cookies from "cookies";
import { prisma } from "../lib/db";
import { getCookieWallet } from "./auth.service";
import { getUserByAccessToken } from "./discord.service";
import { getUserByDiscordIdentifiers } from "./user.service";

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
  chainId: number
) => {
  return await prisma.project.findFirst({
    where: { address, chainId },
    include: { nfts: { include: { properties: true } }, owner: true },
  });
};

export const addNewProject = async (
  name: string,
  address: string,
  description: string,
  imageUrl: string,
  userId: number,
  whitelist: string[],
  chainId: number,
  collectionType: string
) => {
  return await prisma.project.create({
    data: {
      name,
      userId,
      address,
      description,
      imageUrl,
      whitelist,
      chainId,
      collectionType,
    },
  });
};

export const createProjectForCookieWalletUser = async (
  name: string,
  address: string,
  description: string,
  imageUrl: string,
  whitelist: string[],
  chainId: number,
  collectionType: string,
  signerAddress: string,
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
    dbUser.id,
    whitelist,
    chainId,
    collectionType
  );
};

export const createProjectForLoggedInUser = async (
  name: string,
  address: string,
  description: string,
  imageUrl: string,
  whitelist: string[],
  accessToken: string,
  chainId: number,
  collectionType: string
) => {
  const user = await getUserByAccessToken(accessToken);
  if (!user) throw "User not logged in";
  const dbUser = await getUserByDiscordIdentifiers(
    user.username,
    user.discriminator
  );
  if (!dbUser) throw "User not found in db";
  const newProject = await addNewProject(
    name,
    address,
    description,
    imageUrl,
    dbUser.id,
    whitelist,
    chainId,
    collectionType
  );
  return newProject;
};

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
  name: string,
  userId: number,
  whitelist: string[],
  uid: string,
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
      name,
      userId,
      whitelist,
      uid,
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
      nfts: true,
    },
  });
};

export const getProjectsWithValidUid = async () => {
  return await prisma.project.findMany({ where: { uid: { not: null } } });
};

export const getProjectMetadata = async (address: string, chainId: number) => {
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
    fee_recipient: project.owner.walletAddress,
  };
};
