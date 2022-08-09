import { Client, GuildMember, Intents, Role } from "discord.js";
import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { getUserByAccessToken } from "../../../../services/discord.service";

export default nextConnect<NextApiRequest, NextApiResponse>().get(
  async (req, res) => {
    const user = await getUserByAccessToken("Js02LiiP7reyeeX9nlnQQPcZHdCtvW");
    if (!user) return res.json("User not found by access token");
    const client = new Client({
      intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS],
    });
    const result = await client.login(
      "OTkwNzA1NTk3OTUzNDc0NTkw.G3Afl3.IfJlPlvey5ft_gS2i98PGksJeybRJeinhvvwvw"
    );

    console.log(client.user?.id);

    const guilds = await client.guilds.fetch();

    const ug = await Promise.all(guilds.map((g) => g.fetch()));

    const uug = await Promise.all(
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
    );

    console.log(client.user?.id);

    client.destroy();
    return res.json(
      uug.map((u) => ({
        guild: { id: u.guild.id, name: u.guild.name },
        botCanManageRole: u.members
          .find((m) => m.id === client.user?.id)
          ?.guildMember.permissions.has("MANAGE_ROLES"),
        guildRoles: u.roles.map((r) => ({ id: r.id, name: r.role.name })),
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
      }))
    );
  }
);
