import axios from "axios";
import Cookies from "cookies";
import { NextApiResponse, NextApiRequest } from "next";
import {
  ACCESS_TOKEN_COOKIE_KEY,
  DISCORD_OAUTH_CLIENT_ID,
  DISCORD_OAUTH_CLIENT_SECRET,
  ENV_PROTOCOL,
} from "../constants/configuration";
import { DiscordAccessTokenResponse, DiscordUserResponse } from "../types";

export const removeDiscordAccessToken = (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const cookie = new Cookies(req, res);
  cookie.set(ACCESS_TOKEN_COOKIE_KEY, "", {
    expires: new Date(Date.now() - 86400),
  });
};

export const getUserByAccessToken = async (accessToken: string) => {
  try {
    const { data: user }: { data: DiscordUserResponse } = await axios.get(
      `https://discord.com/api/v8/users/@me`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    return user;
  } catch (error) {
    console.log("Error fetching user from discord : ", error);

    return null;
  }
};

export const getDiscordUsersCreds = async (code: string, host: string) => {
  const payload = new URLSearchParams({
    client_id: DISCORD_OAUTH_CLIENT_ID,
    client_secret: DISCORD_OAUTH_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: `${ENV_PROTOCOL}://${host}/api/v1/auth/discord/redirect`,
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
  return { user, creds };
};
