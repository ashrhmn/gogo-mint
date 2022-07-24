import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { getMultipleRandomMessageSignature } from "../../../../../controllers/platformSigner.controller";

export default nextConnect<NextApiRequest, NextApiResponse>().get(
  getMultipleRandomMessageSignature
);
