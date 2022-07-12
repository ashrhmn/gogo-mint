import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { walletSignLogin } from "../../../../../controllers/wallet.controller";

export default nextConnect<NextApiRequest, NextApiResponse>().post(
  walletSignLogin
);
