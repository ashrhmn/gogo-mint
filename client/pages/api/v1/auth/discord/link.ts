import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { linkWalletToDiscord } from "../../../../../controllers/User";

export default nextConnect<NextApiRequest, NextApiResponse>().post(
  linkWalletToDiscord
);
