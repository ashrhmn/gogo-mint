import { SaleConfig } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import * as SaleConfigService from "../services/saleConfig.service";
import { getHttpCookie } from "../utils/Request.utils";
import { errorResponse, successResponse } from "../utils/Response.utils";

export const getSaleConfigByProjectId = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const projectId = req.query.projectId;
    if (!projectId || typeof projectId !== "string" || isNaN(+projectId))
      return res.json(errorResponse("Invalid Project ID"));
    return res.json(
      successResponse(
        await SaleConfigService.getSaleConfigsByProjectId(+projectId)
      )
    );
  } catch (error) {
    console.log("Error getting sale configs by project id : ", error);
    return res.json(errorResponse(error));
  }
};

export const updateSaleConfigs = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const projectId = req.query.projectId;
    if (!projectId || typeof projectId !== "string" || isNaN(+projectId))
      return res.json(errorResponse("Invalid Project ID"));
    const saleConfigs = req.body.saleConfigs as SaleConfig[];
    return res.json(
      successResponse(
        await SaleConfigService.updateSaleConfigs(
          +projectId,
          saleConfigs,
          getHttpCookie(req, res)
        )
      )
    );
  } catch (error) {
    console.log("Error updating sale configs : ", error);
    return res.json(errorResponse(error));
  }
};
