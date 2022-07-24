import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { getRandomMessageSignature } from "../../../../../controllers/platformSigner.controller";

export default nextConnect<NextApiRequest, NextApiResponse>().get(
  getRandomMessageSignature
);
