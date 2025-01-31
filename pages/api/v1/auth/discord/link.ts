import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { linkDiscordToWallet } from "../../../../../controllers/wallet.controller";

export default nextConnect<NextApiRequest, NextApiResponse>().post(
  linkDiscordToWallet
);
