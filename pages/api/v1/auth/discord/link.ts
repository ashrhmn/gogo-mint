import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { linkWalletToDiscord } from "../../../../../controllers/user.controller";

export default nextConnect<NextApiRequest, NextApiResponse>().post(
  linkWalletToDiscord
);
