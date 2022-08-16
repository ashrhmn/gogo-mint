import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { getHiddenNftMetadata } from "../../../controllers/nft.controller";

export default nextConnect<NextApiRequest, NextApiResponse>().get(
  getHiddenNftMetadata
);
