import { NextApiRequest, NextApiResponse } from "next";
import { PLATFORM_SIGNER_PRIVATE_KEY } from "../constants/configuration";
import * as WalletService from "../services/wallet.service";
import { errorResponse, successResponse } from "../utils/Response.utils";

export const getPlatformSignerPublicKey = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    return res.json(
      successResponse(
        WalletService.getPublicAddressFromPrivateKey(
          PLATFORM_SIGNER_PRIVATE_KEY
        )
      )
    );
  } catch (error) {
    console.log("Error getting platform signer public address : ", error);
    return res.json(errorResponse(error));
  }
};
