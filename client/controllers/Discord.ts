import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";
import { URLSearchParams } from "url";
import { DiscordAccessTokenResponse, DiscordUserResponse } from "../types";
import { prisma } from "../prisma/db";
import Cookies from "cookies";
import CryptoJS from "crypto-js";
import {
  ACCESS_TOKEN_COOKIE_KEY,
  CRYPTO_SECRET,
  ENV_PROTOCOL,
} from "../constants/configuration";
import { removeDiscordAccessToken } from "../services/Discord";
import { successResponse } from "../utils/Response";

export const discordRedirectGet = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    if (req.query.code) {
      const payload = new URLSearchParams({
        client_id: process.env.DISCORD_OAUTH_CLIENT_ID || "892427349927280732",
        client_secret:
          process.env.DISCORD_OAUTH_CLIENT_SECRET ||
          "zKxjMkC-GmD8J0gvrZm3yKSEqnBS8LhE",
        grant_type: "authorization_code",
        code: req.query.code.toString(),
        redirect_uri: `${ENV_PROTOCOL}://${req.headers.host}/api/v1/auth/discord/redirect`,
      }).toString();
      const { data: creds }: { data: DiscordAccessTokenResponse } =
        await axios.post("https://discord.com/api/v8/oauth2/token", payload, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        });
      const { data: user }: { data: DiscordUserResponse } = await axios.get(
        `https://discord.com/api/v8/users/@me`,
        {
          headers: { Authorization: `Bearer ${creds.access_token}` },
        }
      );
      const encryptedToken = CryptoJS.AES.encrypt(
        creds.access_token,
        CRYPTO_SECRET
      ).toString();
      const cookie = new Cookies(req, res);
      cookie.set(ACCESS_TOKEN_COOKIE_KEY, encryptedToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });
      const upsert = await prisma.user.upsert({
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
      return res.redirect(`/authenticate`);
    }
    return res.json({ no: "code" });
  } catch (error) {
    console.log("Error : ", error);
    return res.json(error);
  }
};

export const logoutDiscord = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  removeDiscordAccessToken(req, res);
  return res.json(successResponse("Success"));
};
