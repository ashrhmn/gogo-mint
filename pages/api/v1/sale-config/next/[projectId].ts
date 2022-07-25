import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { getNextSaleConfig } from "../../../../../controllers/saleConfig.controller";

export default nextConnect<NextApiRequest, NextApiResponse>().get(
  getNextSaleConfig
);
