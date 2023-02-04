import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import * as MintService from "../services/mint.service";
import { errorResponse, successResponse } from "../utils/Response.utils";

export const prepareMintData = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const { mintCount, projectId, walletAddress } = z
      .object({
        projectId: z.number(),
        walletAddress: z.string(),
        mintCount: z.number(),
      })
      .parse(req.body);
    return res.json(
      successResponse(
        await MintService.prepareMintData(projectId, walletAddress, mintCount)
      )
    );
  } catch (error) {
    return res.status(400).json(errorResponse(error));
  }
};
