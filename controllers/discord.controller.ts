import { NextApiRequest, NextApiResponse } from "next";
import Cookies from "cookies";
import {
  ACCESS_TOKEN_COOKIE_KEY,
  DISCORD_AUTH_URL,
} from "../constants/configuration";
import {
  getDiscordUsersCreds,
  removeDiscordAccessToken,
  refreshDiscordRoles2,
} from "../services/discord.service";
import { errorResponse, successResponse } from "../utils/Response.utils";
import { encryptToken } from "../utils/String.utils";
import { updateUserOnDiscordAuth } from "../services/user.service";
import { z } from "zod";
import * as DiscordService from "../services/discord.service";
import { getHttpCookie } from "../utils/Request.utils";

export const discordRedirectGet = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    if (req.query.code && typeof req.query.code == "string") {
      const { user, creds } = await getDiscordUsersCreds(req.query.code);
      const encryptedToken = encryptToken(creds.access_token);
      const cookie = new Cookies(req, res);
      cookie.set(ACCESS_TOKEN_COOKIE_KEY, encryptedToken, {
        httpOnly: true,
        // secure: process.env.NODE_ENV === "production",
      });
      const upsert = await updateUserOnDiscordAuth(user, creds);
      return res.redirect(`/authenticate`);
    }
    return res.redirect(DISCORD_AUTH_URL);
  } catch (error) {
    console.log("Error : ", error);
    return res.status(500).json({ message: "Error authenticating discord" });
  }
};

export const logoutDiscord = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  removeDiscordAccessToken(req, res);
  return res.json(successResponse("Success"));
};

export const refreshRoleIntegrations = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const data = z
      .object({
        projectAddress: z.string().optional(),
        walletAddress: z.string().optional(),
        discordUsername: z.string().optional(),
        discordDiscriminator: z.number().optional(),
      })
      .parse(req.body);

    refreshDiscordRoles2(data);

    return res.json({ message: "Added to queue to refresh" });
  } catch (error) {
    console.log("Error refreshing discord roles : ", error);
    return res.status(500).json({ message: "Error refreshing discord roles" });
  }
};

export const getServerListWithAdminOrManageRole = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const cookies = getHttpCookie(req, res);
    const data = await DiscordService.getServerListWithAdminOrManageRole(
      cookies
    );
    return res.json(successResponse(data));
  } catch (error) {
    console.log("Error getting server list : ", error);
    return res.status(500).json(errorResponse("Error getting server list"));
  }
};
