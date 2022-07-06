import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { getNftMetadata } from "../../../../controllers/nft.controller";

export default nextConnect<NextApiRequest, NextApiResponse>().get(
  getNftMetadata
);
