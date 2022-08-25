import axios from "axios";
import Cookies from "cookies";
import { Client, GuildMember, Intents, Role } from "discord.js";
import { NextApiResponse, NextApiRequest } from "next";
import {
  ACCESS_TOKEN_COOKIE_KEY,
  BASE_API_URL,
  DISCORD_OAUTH_CLIENT_ID,
  DISCORD_OAUTH_CLIENT_SECRET,
  ZERO_ADDRESS,
} from "../constants/configuration";
import { DiscordAccessTokenResponse, DiscordUserResponse } from "../types";
import { decryptAccessToken } from "../utils/String.utils";
import { prisma } from "../lib/db";
import {
  Collection1155__factory,
  Collection721__factory,
} from "../ContractFactory";
import { getDefaultProvider } from "ethers";
import { RPC_URLS } from "../constants/RPC_URL";

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
    return user;
  } catch (error) {
    console.log("Error fetching user from discord : ", error);
    return null;
  }
};

export const getDiscordUsersCreds = async (
  code: string,
  userType?: "buyer" | "creator"
) => {
  const payload = new URLSearchParams({
    client_id: DISCORD_OAUTH_CLIENT_ID,
    client_secret: DISCORD_OAUTH_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: `${BASE_API_URL}auth/discord/redirect${
      userType === "buyer" ? "-buyer" : ""
    }`,
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
  const data = (
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
  client.destroy();
  return data;
};

export const getServerListWithAdminOrManageRole = async (cookies: Cookies) => {
  const encryptedAccessToken = cookies.get(ACCESS_TOKEN_COOKIE_KEY);
  if (!encryptedAccessToken) throw "User not logged in";
  const accessToken = decryptAccessToken(encryptedAccessToken);
  const user = await getUserByAccessToken(accessToken);
  if (!user) throw "Invalid Access Token";
  const guilds = (await getAllGuildDetails()).filter((g) =>
    g.members.map((m) => m.id).includes(user.id)
  );
  return guilds;
};

export const refreshDiscordRoles = async () => {
  const usersWithDiscordConnected = await prisma.user.findMany({
    where: {
      AND: [
        { discordUsername: { not: null } },
        { discordDiscriminator: { not: null } },
        { walletAddress: { not: null } },
      ],
    },
  });

  const client = await getDiscordClient();
  const roleIntegrations = await prisma.roleIntegration.findMany({
    include: { Project: true },
  });
  roleIntegrations.forEach(async (ri) => {
    if (ri.Project === null) return;
    const guild = await client.guilds.fetch(ri.guildId);
    const role = await guild.roles.fetch(ri.roleId);
    if (role === null) return;
    role.members.forEach(async (m) => {
      const dbUser = usersWithDiscordConnected.find(
        (u) =>
          u.discordUsername === m.user.username &&
          u.discordDiscriminator?.toString() === m.user.discriminator
      );
      if (!dbUser) m.roles.remove(ri.roleId);
      if (
        ri.Project?.address === null ||
        ri.Project?.chainId === null ||
        !RPC_URLS[ri.Project?.chainId || -1]
      )
        return;
      if (ri.Project?.collectionType === "721") {
        const contract = Collection721__factory.connect(
          ri.Project.address,
          getDefaultProvider(RPC_URLS[ri.Project.chainId])
        );
        const balance = await contract
          .balanceOf(dbUser?.walletAddress as string)
          .then((v) => v.toNumber())
          .catch((err) => 0);
        if (balance >= ri.minValidNfts) {
          console.log(
            `Adding role ${ri.roleId} to user ${m.user.username}#${m.user.discriminator}`
          );
          m.roles.add(ri.roleId);
        } else {
          console.log(
            `Removing role ${ri.roleId} from user ${m.user.username}#${m.user.discriminator}`
          );
          m.roles.remove(ri.roleId);
        }
      }
      if (ri.Project?.collectionType === "1155") {
        const contract = Collection1155__factory.connect(
          ri.Project.address,
          getDefaultProvider(RPC_URLS[ri.Project.chainId])
        );
        const balance = await contract
          .balanceOf(dbUser?.walletAddress as string, 0)
          .then((v) => v.toNumber())
          .catch((err) => 0);
        if (balance >= ri.minValidNfts) {
          console.log(
            `Adding role ${ri.roleId} to user ${m.user.username}#${m.user.discriminator}`
          );
          m.roles.add(ri.roleId);
        } else {
          console.log(
            `Removing role ${ri.roleId} from user ${m.user.username}#${m.user.discriminator}`
          );
          m.roles.remove(ri.roleId);
        }
      }
    });
    usersWithDiscordConnected.forEach(async (user) => {
      if (
        user.discordUsername === null ||
        user.discordDiscriminator === null ||
        user.walletAddress === null
      )
        return;
      const member = (await guild.members.fetch()).find(
        (u) =>
          u.user.username === user.discordUsername &&
          u.user.discriminator === user.discordDiscriminator?.toString()
      );
      if (!member) return;
      if (
        ri.Project?.address === null ||
        ri.Project?.chainId === null ||
        !RPC_URLS[ri.Project?.chainId || -1]
      )
        return;
      if (ri.Project?.collectionType === "721") {
        const contract = Collection721__factory.connect(
          ri.Project.address,
          getDefaultProvider(RPC_URLS[ri.Project.chainId])
        );
        const balance = await contract
          .balanceOf(user.walletAddress)
          .then((v) => v.toNumber())
          .catch((err) => 0);
        if (balance >= ri.minValidNfts) {
          if (Array.from(member.roles.cache.keys()).includes(ri.roleId)) return;
          console.log(
            `Adding role ${ri.roleId} to user ${member.user.username}#${member.user.discriminator}`
          );
          member.roles.add(ri.roleId);
        } else {
          if (!Array.from(member.roles.cache.keys()).includes(ri.roleId))
            return;
          console.log(
            `Removing role ${ri.roleId} from user ${member.user.username}#${member.user.discriminator}`
          );
          member.roles.remove(ri.roleId);
        }
      }
      if (ri.Project?.collectionType === "1155") {
        const contract = Collection1155__factory.connect(
          ri.Project.address,
          getDefaultProvider(RPC_URLS[ri.Project.chainId])
        );
        const balance = await contract
          .balanceOf(user.walletAddress, 0)
          .then((v) => v.toNumber())
          .catch((err) => 0);
        if (balance >= ri.minValidNfts) {
          if (Array.from(member.roles.cache.keys()).includes(ri.roleId)) return;
          console.log(
            `Adding role ${ri.roleId} to user ${member.user.username}#${member.user.discriminator}`
          );
          member.roles.add(ri.roleId);
        } else {
          if (!Array.from(member.roles.cache.keys()).includes(ri.roleId))
            return;
          console.log(
            `Removing role ${ri.roleId} from user ${member.user.username}#${member.user.discriminator}`
          );
          member.roles.remove(ri.roleId);
        }
      }
    });
  });

  return usersWithDiscordConnected;
};

export const refreshDiscordRoles2 = async ({
  discordDiscriminator,
  discordUsername,
  projectAddress,
  walletAddress,
}: {
  projectAddress?: string;
  walletAddress?: string;
  discordUsername?: string;
  discordDiscriminator?: number;
}) => {
  const roleIntegrations = !!projectAddress
    ? await prisma.roleIntegration.findMany({
        include: { Project: true },
        where: { Project: { address: projectAddress } },
      })
    : await prisma.roleIntegration.findMany({
        include: { Project: true },
      });

  console.log(
    "Selected integrations : ",
    roleIntegrations.map((ri) => ({
      name: ri.Project?.name,
      address: ri.Project?.address,
    }))
  );

  const users = await prisma.user.findMany({
    where: {
      AND: [
        {
          discordDiscriminator: !!discordDiscriminator
            ? { equals: discordDiscriminator }
            : { not: null },
        },
        {
          discordUsername: !!discordUsername
            ? { equals: discordUsername, mode: "insensitive" }
            : { not: null },
        },
        {
          walletAddress: !!walletAddress
            ? { equals: walletAddress, mode: "insensitive" }
            : { not: null },
        },
      ],
    },
  });

  console.log(
    "Selected users for integrations : ",
    users.map((user) => ({
      username: user.discordUsername,
      discriminator: user.discordDiscriminator,
      walletAddress: user.walletAddress,
    }))
  );

  roleIntegrations.forEach(async (ri) => {
    const client = await getDiscordClient();
    const guild = await client.guilds.fetch(ri.guildId);
    const role = await guild.roles.fetch(ri.roleId);
    await guild?.members.fetch();
    if (role === null) return;
    role.members.forEach(async (m) => {
      const dbUser = await prisma.user.findFirst({
        where: {
          AND: [
            { discordUsername: m.user.username },
            { discordDiscriminator: +m.user.discriminator },
            { walletAddress: { not: null } },
          ],
        },
      });
      if (dbUser === null) {
        m.roles.remove(ri.roleId);
        return;
      }
      if (dbUser.walletAddress === null) {
        m.roles.remove(ri.roleId);
        return;
      }
      if (ri.Project === null) return;
      if (
        ri.Project.address === null ||
        ri.Project.chainId === null ||
        ri.Project.collectionType === null
      )
        return;

      if (
        !(await isValidNftHolder(
          ri.Project.address,
          ri.Project.chainId,
          ri.minValidNfts,
          ri.Project.collectionType as "721" | "1155",
          dbUser.walletAddress
        ))
      ) {
        console.log(
          `Removing role ${ri.roleId} from user ${dbUser.discordUsername}#${dbUser.discordDiscriminator}`
        );
        m.roles.remove(ri.roleId);
      }
    });
    users.forEach(async (user) => {
      if (
        user.discordUsername === null ||
        user.discordDiscriminator === null ||
        user.walletAddress === null
      )
        return;

      const member = (await guild.members.fetch()).find(
        (u) =>
          u.user.username === user.discordUsername &&
          u.user.discriminator === user.discordDiscriminator?.toString()
      );
      if (!member) return;
      if (ri.Project === null) return;
      if (
        ri.Project.address === null ||
        ri.Project.chainId === null ||
        ri.Project.collectionType === null
      )
        return;
      if (
        await isValidNftHolder(
          ri.Project.address,
          ri.Project.chainId,
          ri.minValidNfts,
          ri.Project.collectionType as "721" | "1155",
          user.walletAddress
        )
      ) {
        if (Array.from(member.roles.cache.keys()).includes(ri.roleId)) return;
        console.log(
          `Adding role ${ri.roleId} to user ${user.discordUsername}#${user.discordDiscriminator}`
        );
        member.roles.add(ri.roleId);
      }
    });
  });
  return { message: "Added to queue" };
};

export const isValidNftHolder = async (
  projectAddress: string,
  projectChainId: number,
  minNft: number,
  projectType: "721" | "1155",
  ownerAddress: string
) => {
  if (ownerAddress === ZERO_ADDRESS) return false;
  const balance =
    projectType === "721"
      ? await Collection721__factory.connect(
          projectAddress,
          getDefaultProvider(RPC_URLS[projectChainId])
        )
          .balanceOf(ownerAddress)
          .then((r) => r.toNumber())
          .catch((err) => {
            console.log("Error getting balance : ", err);
            return 0;
          })
      : projectType === "1155"
      ? await Collection1155__factory.connect(
          projectAddress,
          getDefaultProvider(RPC_URLS[projectChainId])
        )
          .balanceOf(ownerAddress, 0)
          .then((r) => r.toNumber())
          .catch((err) => {
            console.log("Error getting balance : ", err);
            return 0;
          })
      : 0;

  console.log(`Checking ${balance}>=${minNft} : ${balance >= minNft}`);

  return balance >= minNft;
};

export const refreshDiscordRolesOnTransferEvent = async (
  projectAddress: string,
  projectChainId: number,
  projectType: "721" | "1155",
  from: string,
  to: string
) => {
  const roleIntegrations = await prisma.roleIntegration.findMany({
    where: { Project: { address: projectAddress } },
  });

  const fromDbUser =
    from === ZERO_ADDRESS
      ? null
      : await prisma.user.findFirst({
          where: { walletAddress: { mode: "insensitive", equals: from } },
        });

  const toDbUser =
    to === ZERO_ADDRESS
      ? null
      : await prisma.user.findFirst({
          where: { walletAddress: { mode: "insensitive", equals: to } },
        });

  console.log({ fromDbUser, toDbUser });
  const client = await getDiscordClient();

  roleIntegrations.forEach(async (ri) => {
    if (
      fromDbUser !== null &&
      fromDbUser.discordUsername !== null &&
      fromDbUser.discordDiscriminator !== null
    ) {
      if (
        await isValidNftHolder(
          projectAddress,
          projectChainId,
          ri.minValidNfts,
          projectType,
          from
        )
      ) {
        console.log("from if");

        // const client = await getDiscordClient();
        const guild = await client.guilds.fetch(ri.guildId);
        const member = (await guild.members.fetch()).find(
          (m) =>
            m.user.username === fromDbUser.discordUsername &&
            m.user.discriminator === fromDbUser.discordDiscriminator?.toString()
        );
        if (member) {
          console.log(
            `Adding role ${ri.roleId} to user ${fromDbUser.discordUsername}#${fromDbUser.discordDiscriminator}`
          );
          member.roles.add(ri.roleId);
          // client.destroy();
        }
      } else {
        console.log("from else");
        // const client = await getDiscordClient();
        const guild = await client.guilds.fetch(ri.guildId);
        const member = (await guild.members.fetch()).find(
          (m) =>
            m.user.username === fromDbUser.discordUsername &&
            m.user.discriminator === fromDbUser.discordDiscriminator?.toString()
        );
        if (member) {
          console.log(
            `Removing role ${ri.roleId} from user ${fromDbUser.discordUsername}#${fromDbUser.discordDiscriminator}`
          );
          member.roles.remove(ri.roleId);
          // client.destroy();
        }
      }
    }

    if (
      toDbUser !== null &&
      toDbUser.discordUsername !== null &&
      toDbUser.discordDiscriminator !== null
    ) {
      if (
        await isValidNftHolder(
          projectAddress,
          projectChainId,
          ri.minValidNfts,
          projectType,
          to
        )
      ) {
        console.log("to if");
        // const client = await getDiscordClient();
        const guild = await client.guilds.fetch(ri.guildId);
        const member = (await guild.members.fetch()).find(
          (m) =>
            m.user.username === toDbUser.discordUsername &&
            m.user.discriminator === toDbUser.discordDiscriminator?.toString()
        );
        if (member) {
          console.log(
            `Adding role ${ri.roleId} to user ${toDbUser.discordUsername}#${toDbUser.discordDiscriminator}`
          );
          member.roles.add(ri.roleId);
          // client.destroy();
        }
      } else {
        console.log("to else");
        // const client = await getDiscordClient();
        const guild = await client.guilds.fetch(ri.guildId);
        const member = (await guild.members.fetch()).find(
          (m) =>
            m.user.username === toDbUser.discordUsername &&
            m.user.discriminator === toDbUser.discordDiscriminator?.toString()
        );
        if (member) {
          console.log(
            `Removing role ${ri.roleId} from user ${toDbUser.discordUsername}#${toDbUser.discordDiscriminator}`
          );
          member.roles.remove(ri.roleId);
          // client.destroy();
        }
      }
    }
  });

  return roleIntegrations;
};
