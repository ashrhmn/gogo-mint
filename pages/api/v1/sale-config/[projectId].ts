import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import {
  getSaleConfigByProjectId,
  updateSaleConfigs,
} from "../../../../controllers/saleConfig.controller";

export default nextConnect<NextApiRequest, NextApiResponse>()
  .get(getSaleConfigByProjectId)
  .put(updateSaleConfigs);
