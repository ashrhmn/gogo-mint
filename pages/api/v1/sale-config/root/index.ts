import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { getSaleConfigRoot } from "../../../../../controllers/saleConfigMerkle.controller";

export default nextConnect<NextApiRequest, NextApiResponse>().post(
  getSaleConfigRoot
);
