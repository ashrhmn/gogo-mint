import Cookies from "cookies";
import { NextApiRequest, NextApiResponse } from "next";
import {
  ACCESS_TOKEN_COOKIE_KEY,
  CRYPTO_SECRET,
} from "../constants/configuration";
import { prisma } from "../prisma/db";
import CryptoJS from "crypto-js";
import axios from "axios";
import { DiscordUserResponse } from "../types";
import * as UserService from "../services/User";
import { errorResponse, successResponse } from "../utils/Response";
import { User } from "@prisma/client";

export const getAllUser = async (req: NextApiRequest, res: NextApiResponse) => {
  return res.json(await prisma.user.findMany());
};

export const getLoggedInUser = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const encryptedAccessToken =
    req.query[ACCESS_TOKEN_COOKIE_KEY] || req.headers.token;
  if (!encryptedAccessToken || typeof encryptedAccessToken !== "string")
    return res.json({ message: "Access Token Not Found" });
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
  return res.json(user);
};

export const getUserByDiscordIdentifiers = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const { username, discriminator } = req.query;
  if (
    !username ||
    !discriminator ||
    typeof username !== "string" ||
    typeof discriminator !== "string"
  )
    return res.json(errorResponse("Username or Discriminator not provided"));
  const user = await UserService.getUserByDiscordIdentifiers(
    username,
    discriminator
  );
  if (!user) return res.json(errorResponse("User not found"));
  return res.json(successResponse(user));
};

export const getUserByWalletAddress = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const address = req.query.address;
  if (!address || typeof address !== "string")
    return res.json(errorResponse("address not provided"));

  const user = await UserService.getUserByWalletAddress(address);
  if (!user) return res.json(errorResponse("User not found"));
  return res.json(successResponse(user));
};

export const getUserByIdentifiers = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const { username, discriminator, address } = req.query;
  let user: User | null = null;
  if (address && typeof address === "string") {
    user = await UserService.getUserByWalletAddress(address);
  } else if (
    username &&
    discriminator &&
    typeof username === "string" &&
    typeof discriminator === "string"
  ) {
    user = await UserService.getUserByDiscordIdentifiers(
      username,
      discriminator
    );
  } else {
    return res.json(errorResponse("At least one identifier required"));
  }
  if (!user) return res.json(errorResponse("User not found"));
  return res.json(successResponse(user));
};

export const linkWalletToDiscord = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const { username, discriminator, address } = req.body;
  if (
    !username ||
    !discriminator ||
    !address ||
    typeof username !== "string" ||
    typeof discriminator !== "string" ||
    typeof address !== "string"
  )
    return res.json(
      errorResponse(`Invalid payload : ${JSON.stringify(req.body)}`)
    );
  const user = await UserService.updateUserWalletAddress(
    username,
    discriminator,
    address
  );
  return res.json(successResponse(user));
};
