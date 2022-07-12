import { NextApiRequest, NextApiResponse } from "next";
import Cookies from "cookies";
import {
  ACCESS_TOKEN_COOKIE_KEY,
  DISCORD_AUTH_URL,
} from "../constants/configuration";
import {
  getDiscordUsersCreds,
  removeDiscordAccessToken,
} from "../services/discord.service";
import { successResponse } from "../utils/Response.utils";
import { encryptToken } from "../utils/String.utils";
import { updateUserOnDiscordAuth } from "../services/user.service";

export const discordRedirectGet = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    if (req.query.code && typeof req.query.code == "string") {
      const { user, creds } = await getDiscordUsersCreds(
        req.query.code,
        req.headers.host as string
      );
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
    return res.json({ message: "Error authenticating discord" });
  }
};

export const logoutDiscord = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  removeDiscordAccessToken(req, res);
  return res.json(successResponse("Success"));
};
