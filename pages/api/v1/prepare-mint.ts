import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { prepareMintData } from "../../../controllers/mint.controller";

export default nextConnect<NextApiRequest, NextApiResponse>().post(
  prepareMintData
);
