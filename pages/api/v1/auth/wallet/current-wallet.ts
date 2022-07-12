import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { getCurrentlySignedWallet } from "../../../../../controllers/wallet.controller";

export default nextConnect<NextApiRequest, NextApiResponse>().get(
  getCurrentlySignedWallet
);
