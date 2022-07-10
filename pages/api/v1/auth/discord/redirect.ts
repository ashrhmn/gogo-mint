import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { discordRedirectGet } from "../../../../../controllers/discord.controller";

export default nextConnect<NextApiRequest, NextApiResponse>().get(
  discordRedirectGet
);
