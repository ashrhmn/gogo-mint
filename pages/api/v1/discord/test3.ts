import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { refreshDiscordRoles2 } from "../../../../services/discord.service";

export default nextConnect<NextApiRequest, NextApiResponse>().get(
  async (req, res) => {
    return res.json(await refreshDiscordRoles2({}));
  }
);
