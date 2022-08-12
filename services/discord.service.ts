import axios from "axios";
import Cookies from "cookies";
import { Client, GuildMember, Intents, Role } from "discord.js";
import { NextApiResponse, NextApiRequest } from "next";
import {
  ACCESS_TOKEN_COOKIE_KEY,
  BASE_API_URL,
  DISCORD_OAUTH_CLIENT_ID,
  DISCORD_OAUTH_CLIENT_SECRET,
  ENV_PROTOCOL,
} from "../constants/configuration";
import { DiscordAccessTokenResponse, DiscordUserResponse } from "../types";
import { decryptAccessToken } from "../utils/String.utils";

export const removeDiscordAccessToken = (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const cookie = new Cookies(req, res);
  cookie.set(ACCESS_TOKEN_COOKIE_KEY, "", {
    expires: new Date(0),
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
    console.log({ user });

    return user;
  } catch (error) {
    console.log("Error fetching user from discord : ", error);

    return null;
  }
};

export const getDiscordUsersCreds = async (code: string) => {
  const payload = new URLSearchParams({
    client_id: DISCORD_OAUTH_CLIENT_ID,
    client_secret: DISCORD_OAUTH_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: `${BASE_API_URL}auth/discord/redirect`,
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

export const getDiscordClient = async () => {
  const client = new Client({
    intents: [Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILDS],
  });
  await client.login(process.env.BOT_CLIENT_SECRET);
  return client;
};

export const getAllGuildDetails = async () => {
  const client = await getDiscordClient();
  return (
    await Promise.all(
      (
        await Promise.all((await client.guilds.fetch()).map((g) => g.fetch()))
      ).map(async (guild) => {
        const members = await guild.members.fetch();
        const roles = await guild.roles.fetch();
        return {
          guild,
          members: Array.from(members.keys()).map((key) => ({
            id: key,
            guildMember: members.get(key) as GuildMember,
          })),
          roles: Array.from(roles.keys()).map((key) => ({
            id: key,
            role: roles.get(key) as Role,
          })),
        };
      })
    )
  ).map((u) => ({
    guild: { id: u.guild.id, name: u.guild.name },
    botCanManageRole: u.members
      .find((m) => m.id === client.user?.id)
      ?.guildMember.permissions.has("MANAGE_ROLES"),
    guildRoles: u.roles
      .map((r) => ({ id: r.id, name: r.role.name }))
      .filter((r) => !(r.name === "@everyone" || r.name === "verify-bot")),
    members: u.members.map((m) => ({
      id: m.guildMember.user.id,
      username: m.guildMember.user.username,
      discriminator: m.guildMember.user.discriminator,
      isAdmin: m.guildMember.permissions.has("ADMINISTRATOR"),
      canManageRole: m.guildMember.permissions.has("MANAGE_ROLES"),
      // permissions: m.guildMember.permissions.toArray(),
      roles: m.guildMember.roles.cache.map((r) => ({
        id: r.id,
        name: r.name,
      })),
    })),
  }));
};

export const getServerListWithAdminOrManageRole = async (cookies: Cookies) => {
  const encryptedAccessToken = cookies.get(ACCESS_TOKEN_COOKIE_KEY);
  if (!encryptedAccessToken) throw "User not logged in";
  const accessToken = decryptAccessToken(encryptedAccessToken);
  console.log({ accessToken });
  const user = await getUserByAccessToken(accessToken);
  console.log({ user });
  if (!user) throw "Invalid Access Token";

  const guilds = (await getAllGuildDetails()).filter((g) =>
    g.members.map((m) => m.id).includes(user.id)
  );

  return guilds;
};
