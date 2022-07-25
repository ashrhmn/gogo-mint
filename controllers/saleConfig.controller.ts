import { SaleConfig } from "@prisma/client";
import { NotFoundError } from "@prisma/client/runtime";
import { isAddress } from "ethers/lib/utils";
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
      return res.status(400).json(errorResponse("Invalid Project ID"));
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
    return res.status(500).json(errorResponse(error));
  }
};

export const getCurrentSaleConfig = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const { projectId } = req.query;
    if (typeof projectId !== "string" || isNaN(+projectId))
      return res.status(400).json("Invalid Project ID");
    return res.json(
      successResponse(await SaleConfigService.getCurrentSale(+projectId))
    );
  } catch (error) {
    if (error instanceof NotFoundError)
      return res.json({ message: "No Sale Running" });
    console.log("Error getting current sale : ", error);
    return res.status(500).json(error);
  }
};

export const getNextSaleConfig = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const { projectId } = req.query;
    if (typeof projectId !== "string" || isNaN(+projectId))
      return res.status(400).json("Invalid Project ID");
    return res.json(
      successResponse(await SaleConfigService.getNextSale(+projectId))
    );
  } catch (error) {
    if (error instanceof NotFoundError)
      return res.json({ message: "No Upcoming Sale Found" });
    console.log("Error getting current sale : ", error);
    return res.status(500).json(error);
  }
};

export const getWhitelistProofBySaleConfig = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const { identifier, address } = req.query;
    if (!identifier || typeof identifier !== "string")
      return res.status(400).json(errorResponse("Invalid sale identifier"));
    if (!address || typeof address !== "string" || !isAddress(address))
      return res.status(400).json(errorResponse("Invalid Address"));
    return res.json(
      successResponse(
        await SaleConfigService.getWhitelistProofBySaleConfig(
          identifier,
          address
        )
      )
    );
  } catch (error) {
    console.log("Error getting whitelist proof : ", error);
    return res.status(500).json(error);
  }
};
