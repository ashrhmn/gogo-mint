import { NextApiRequest, NextApiResponse } from "next";
import * as SaleConfigService from "../services/saleConfig.service";
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
