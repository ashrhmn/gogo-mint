import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { addBatchNftsAsCookieWallet } from "../../../../controllers/nft.controller";

export default nextConnect<NextApiRequest, NextApiResponse>().post(
  addBatchNftsAsCookieWallet
);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
  },
};
