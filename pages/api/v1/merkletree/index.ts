import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { getMerkletreeRoot } from "../../../../controllers/merkletree.controller";

export default nextConnect<NextApiRequest, NextApiResponse>().post(
  getMerkletreeRoot
);
