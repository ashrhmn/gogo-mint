import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { deleteNftById } from "../../../../controllers/nft.controller";

export default nextConnect<NextApiRequest, NextApiResponse>().delete(
  deleteNftById
);
