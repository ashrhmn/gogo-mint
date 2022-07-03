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

export const addNewProject = async (
  name: string,
  address: string,
  description: string,
  imageUrl: string,
  userId: number,
  whitelist: string[],
  chainId: number
) => {
  return await prisma.project.create({
    data: { name, userId, address, description, imageUrl, whitelist, chainId },
  });
};

export const createProjectForLoggedInUser = async (
  name: string,
  address: string,
  description: string,
  imageUrl: string,
  whitelist: string[],
  accessToken: string,
  chainId: number
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
    chainId
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
