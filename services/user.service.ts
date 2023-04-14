// import { NextApiRequest } from "next";
// import { ACCESS_TOKEN_COOKIE_KEY } from "../constants/configuration";
import { prisma } from "../lib/db";
// import { decryptAccessToken } from "../utils/String.utils";
import { getUserByAccessToken } from "./discord.service";
// import { errorResponse, successResponse } from "../utils/Response.utils";
import {
  DiscordAccessTokenResponse,
  DiscordUserResponse,
  NextOrIncomingMessage,
} from "../types";
import { getAccessTokenFromCookie } from "../utils/Request.utils";

export const getLoggedInDiscordUser = async (req: NextOrIncomingMessage) => {
  const accessToken = getAccessTokenFromCookie(req);
  if (!accessToken || typeof accessToken !== "string")
    throw "Access Token Not Found";
  const user = await getUserByAccessToken(accessToken);
  return user;
};

export const getUserByDiscordIdentifiers = async (
  username: string,
  discriminator: string
) =>
  await prisma.user.findFirst({
    where: { discordDiscriminator: +discriminator, discordUsername: username },
  });

export const getUserByWalletAddress = async (address: string) =>
  await prisma.user.findFirst({ where: { walletAddress: address } });

export const updateUserWalletAddressOld = async (
  username: string,
  discriminator: number,
  walletAddress: string
) => {
  return await prisma.user.update({
    where: {
      discordUsername_discordDiscriminator: {
        discordUsername: username,
        discordDiscriminator: discriminator,
      },
    },
    data: {
      walletAddress,
    },
  });
};
export const updateUserWalletAddress = async (
  username: string,
  discriminator: number,
  walletAddress: string
) => {
  await prisma.user.delete({
    where: {
      discordUsername_discordDiscriminator: {
        discordDiscriminator: discriminator,
        discordUsername: username,
      },
    },
  });
  return await prisma.user.upsert({
    where: { walletAddress },
    create: {
      discordUsername: username,
      discordDiscriminator: discriminator,
      walletAddress,
    },
    update: { discordDiscriminator: discriminator, discordUsername: username },
  });
};

export const updateUserOnDiscordAuth = async (
  user: DiscordUserResponse,
  creds: DiscordAccessTokenResponse
) => {
  return await prisma.user.upsert({
    where: {
      discordUsername_discordDiscriminator: {
        discordUsername: user.username,
        discordDiscriminator: +user.discriminator,
      },
    },
    create: {
      discordUsername: user.username,
      discordDiscriminator: +user.discriminator,
      accessToken: creds.access_token,
      refreshToken: creds.refresh_token,
    },
    update: {
      accessToken: creds.access_token,
      refreshToken: creds.refresh_token,
    },
  });
};
