import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { getRandomUnclaimedNftByProjectId } from "../../../../../controllers/nft.controller";

export default nextConnect<NextApiRequest, NextApiResponse>().get(
  getRandomUnclaimedNftByProjectId
);
