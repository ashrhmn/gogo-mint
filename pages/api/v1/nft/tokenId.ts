import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { updateTokenId } from "../../../../controllers/nft.controller";

export default nextConnect<NextApiRequest, NextApiResponse>().put(
  updateTokenId
);
