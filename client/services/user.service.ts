import { NextApiRequest } from "next";
import { ACCESS_TOKEN_COOKIE_KEY } from "../constants/configuration";
import { prisma } from "../lib/db";
import { decryptAccessToken } from "../utils/String.utils";
import { getUserByAccessToken } from "./discord.service";
import { errorResponse, successResponse } from "../utils/Response.utils";
import {
  DiscordAccessTokenResponse,
  DiscordUserResponse,
  NextOrIncomingMessage,
} from "../types";

export const getLoggedInUser = async (req: NextOrIncomingMessage) => {
  try {
    const encryptedAccessToken = req.cookies[ACCESS_TOKEN_COOKIE_KEY];
    if (!encryptedAccessToken || typeof encryptedAccessToken !== "string")
      return { data: null, error: "Access Token Not Found" };
    const accessToken = decryptAccessToken(encryptedAccessToken);
    const user = await getUserByAccessToken(accessToken);
    if (user) return successResponse(user);
    return errorResponse("Error fetching user");
  } catch (error) {
    return errorResponse("Error fetching user : " + error);
  }
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

export const updateUserWalletAddress = async (
  username: string,
  discriminator: string,
  walletAddress: string
) => {
  return await prisma.user.update({
    where: {
      discordUsername_discordDiscriminator: {
        discordUsername: username,
        discordDiscriminator: +discriminator,
      },
    },
    data: {
      walletAddress,
    },
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
      isCreator: false,
      accessToken: creds.access_token,
      refreshToken: creds.refresh_token,
    },
    update: {
      isCreator: false,
      accessToken: creds.access_token,
      refreshToken: creds.refresh_token,
    },
  });
};
