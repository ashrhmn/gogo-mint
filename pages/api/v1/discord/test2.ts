import { Client, Intents } from "discord.js";
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
    await client.login(
      "OTkwNzA1NTk3OTUzNDc0NTkw.G3Afl3.IfJlPlvey5ft_gS2i98PGksJeybRJeinhvvwvw"
    );

    const guild = await client.guilds.fetch("878341574092804167");

    client.destroy();
    return res.json(guild);
  }
);
