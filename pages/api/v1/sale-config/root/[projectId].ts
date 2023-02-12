import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import * as SaleConfigService from "../../../../../services/saleConfig.service";
import { EMPTY_WHITELIST_ROOT } from "../../../../../constants/configuration";
import { ISaleConfigInput } from "../../../../../types";
import {
  successResponse,
  errorResponse,
} from "../../../../../utils/Response.utils";
import { prisma } from "../../../../../lib/db";

export default nextConnect<NextApiRequest, NextApiResponse>().get(
  async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const projectId = req.query.projectId as string;
      if (!projectId)
        return res.status(400).json(errorResponse("No projectId"));
      const saleConfigs = await prisma.saleConfig.findMany({
        where: { projectId: +projectId },
        include: { whitelist: true },
      });
      // const saleConfigs = req.body.saleConfigs as ISaleConfigInput[];
      if (saleConfigs.length === 0)
        return res.json(successResponse(EMPTY_WHITELIST_ROOT));

      const param: ISaleConfigInput[] = saleConfigs.map((sc) => ({
        enabled: sc.enabled,
        endTime: sc.endTime,
        maxMintInSale: sc.maxMintInSale,
        maxMintPerWallet: sc.maxMintPerWallet,
        mintCharge: sc.mintCharge,
        saleType: sc.saleType as "private" | "public",
        uuid: sc.saleIdentifier,
        startTime: sc.startTime,
        tokenGatedAddress: sc.tokenGatedAddress,
        whitelistAddresses: sc.whitelist.map((w) => ({
          address: w.address,
          limit: w.limit,
        })),
      }));
      return res.json(
        successResponse(SaleConfigService.getSaleConfigRoot(param))
      );
    } catch (error) {
      console.log("Error getting sale config root : ", error);
      return res.status(500).json(errorResponse(error));
    }
  }
);
