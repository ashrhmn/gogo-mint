import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../lib/db";
import * as UserService from "../services/user.service";
import { errorResponse, successResponse } from "../utils/Response.utils";
import { User } from "@prisma/client";
import { getUserByAccessToken } from "../services/discord.service";
import { getAccessTokenFromCookie } from "../utils/Request";

export const getAllUser = async (req: NextApiRequest, res: NextApiResponse) => {
  return res.json(await prisma.user.findMany());
};

export const getLoggedInUser = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const accessToken = getAccessTokenFromCookie(req);
  if (!accessToken) return res.json({ message: "Access Token Not Found" });
  const user = await getUserByAccessToken(accessToken);
  if (!user) return res.json(errorResponse("Unauthorized"));
  return res.json(successResponse(user));
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
