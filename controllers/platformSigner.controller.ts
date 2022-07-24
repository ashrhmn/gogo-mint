import { prisma } from "../lib/db";
import { NextApiRequest, NextApiResponse } from "next";
import { PLATFORM_SIGNER_PRIVATE_KEY } from "../constants/configuration";
import * as WalletService from "../services/wallet.service";
import * as PlatformSignerService from "../services/platformSigner.service";
import { errorResponse, successResponse } from "../utils/Response.utils";
import { getCookieWallet } from "../services/auth.service";
import { getHttpCookie } from "../utils/Request.utils";

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

export const getRandomMessageSignature = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const cookieAddress = getCookieWallet(getHttpCookie(req, res));
    await prisma.user.findFirstOrThrow({
      where: { walletAddress: cookieAddress },
    });
    const data = await PlatformSignerService.getRandomMessageSignature();
    return res.json(successResponse(data));
  } catch (error) {
    console.log("Error getting random message signature : ", error);
    return res.json(errorResponse(error));
  }
};

export const getMultipleRandomMessageSignature = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const n = req.query.n;
    if (!n || isNaN(+n))
      return res.status(400).json(errorResponse("Invalid n value"));
    // const cookieAddress = getCookieWallet(getHttpCookie(req, res));
    // await prisma.user.findFirstOrThrow({
    //   where: { walletAddress: cookieAddress },
    // });
    return res.json(
      successResponse(
        await PlatformSignerService.getMultipleRandomMessageSignature(+n)
      )
    );
  } catch (error) {
    console.log("Error getting multiple signature message : ", error);
    return res.status(500).json(errorResponse(error));
  }
};
