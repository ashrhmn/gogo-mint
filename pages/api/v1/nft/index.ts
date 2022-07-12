import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { addNftAsCookieWallet } from "../../../../controllers/nft.controller";

export default nextConnect<NextApiRequest, NextApiResponse>().post(
  addNftAsCookieWallet
);
