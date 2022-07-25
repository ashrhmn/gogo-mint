import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { getCurrentSaleConfig } from "../../../../../controllers/saleConfig.controller";

export default nextConnect<NextApiRequest, NextApiResponse>().get(
  getCurrentSaleConfig
);
