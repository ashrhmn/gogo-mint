import { prisma } from "../lib/db";
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

export const getProjectByChainAddress = async (
  address: string,
  chainId: number
) => {
  return await prisma.project.findFirst({
    where: { address, chainId },
    include: { nfts: { include: { properties: true } } },
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
  return await prisma.project.findFirstOrThrow({ where: { id } });
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
  uid: string
) => {
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
