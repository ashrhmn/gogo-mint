import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { addNftAsDiscordUser } from "../../../controllers/nft.controller";

export default nextConnect<NextApiRequest, NextApiResponse>().post(
  addNftAsDiscordUser
);
