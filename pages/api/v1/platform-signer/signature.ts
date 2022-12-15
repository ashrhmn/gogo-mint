import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { getMintSignature } from "../../../../controllers/platformSigner.controller";

export default nextConnect<NextApiRequest, NextApiResponse>().post(
  getMintSignature
);
