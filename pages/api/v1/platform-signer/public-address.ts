import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { getPlatformSignerPublicKey } from "../../../../controllers/platformSigner.controller";

export default nextConnect<NextApiRequest, NextApiResponse>().get(
  getPlatformSignerPublicKey
);
