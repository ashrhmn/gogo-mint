import { NextApiRequest, NextApiResponse } from "next";
import { errorResponse, successResponse } from "../utils/Response.utils";
import * as SaleConfigService from "../services/saleConfig.service";
import { ISaleConfigInput } from "../types";
import { EMPTY_WHITELIST_ROOT } from "../constants/configuration";

export const getSaleConfigRoot = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const saleConfigs = req.body.saleConfigs as ISaleConfigInput[];
    if (saleConfigs.length == 0)
      return res.json(successResponse(EMPTY_WHITELIST_ROOT));
    return res.json(
      successResponse(SaleConfigService.getSaleConfigRoot(saleConfigs))
    );
  } catch (error) {
    console.log("Error getting sale config root : ", error);
    return res.json(errorResponse(error));
  }
};
