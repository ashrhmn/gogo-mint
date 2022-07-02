import axios from "axios";
import { NextApiRequest } from "next";
import {
  ACCESS_TOKEN_COOKIE_KEY,
  CRYPTO_SECRET,
} from "../constants/configuration";
import { DiscordUserResponse } from "../types";
import CryptoJS from "crypto-js";
import { prisma } from "../prisma/db";

export const getLoggedInUser = async (req: NextApiRequest) => {
  try {
    const encryptedAccessToken = req.cookies[ACCESS_TOKEN_COOKIE_KEY];
    if (!encryptedAccessToken || typeof encryptedAccessToken !== "string")
      return { data: null, error: "Access Token Not Found" };
    const accessToken = CryptoJS.AES.decrypt(
      encryptedAccessToken,
      CRYPTO_SECRET
    ).toString(CryptoJS.enc.Utf8);
    const { data: user }: { data: DiscordUserResponse } = await axios.get(
      `https://discord.com/api/v8/users/@me`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    return { data: user, error: null };
  } catch (error) {
    return { data: null, error };
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
