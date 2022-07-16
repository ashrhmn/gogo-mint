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

    const guilds = await client.guilds.fetch();

    const ug = await Promise.all(guilds.map((g) => g.fetch()));

    const uug = await Promise.all(
      ug.map(async (guild) => {
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

    console.log(
      uug.map((u) => ({
        guild: u.guild.name,
        member: u.members.map((m) => m.guildMember.user.username),
        roles: u.roles.map((r) => r.role.name),
      }))
    );

    // console.log(
    //   uug
    //     .filter((u) => u.members.includes("592387527718207518"))
    //     .map((u) => ({ guild: u.guild.name, member: u.members }))
    // );

    // const role = (
    //   await (await client.guilds.fetch("878341574092804167")).roles.fetch()
    // )
    //   .filter((r) => r.name === "Holders Role")
    //   .keyAt(0);

    // const guilds = (
    //   await (
    //     await client.guilds.fetch("878341574092804167")
    //   ).members.fetch("839116716344082432")
    // ).roles.cache.filter((role) => role.name === "Holders Role");
    // console.log(guilds);
    client.destroy();
    return res.json("Done");
  }
);
