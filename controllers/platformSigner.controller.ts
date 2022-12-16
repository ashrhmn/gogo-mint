import { prisma } from "../lib/db";
import { NextApiRequest, NextApiResponse } from "next";
import { PLATFORM_SIGNER_PRIVATE_KEY } from "../constants/configuration";
import * as WalletService from "../services/wallet.service";
import * as PlatformSignerService from "../services/platformSigner.service";
import { errorResponse, successResponse } from "../utils/Response.utils";
import { getCookieWallet } from "../services/auth.service";
import { getHttpCookie } from "../utils/Request.utils";
import { getCurrentSale } from "../services/saleConfig.service";
import { is721 } from "../services/ethereum.service";
import { getProjectById } from "../services/project.service";

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

export const getMintSignature = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const { account, chainId, projectId, mintCount, signature } = req.body;
    if (isNaN(+projectId)) throw "Invalid Project ID";
    if (isNaN(+chainId)) throw "Invalid Chain ID";
    if (isNaN(+mintCount)) throw "Invalid Mint Count";

    const data = await PlatformSignerService.getMintSignature({
      account,
      mintCount: +mintCount,
      chainId: +chainId,
      projectId: +projectId,
      signature,
    });
    return res.json(successResponse(data));
  } catch (error) {
    console.log("Error getting mint signature : ", error);
    return res.status(400).json(errorResponse(error));
  }
};

export const getRandomMessageSignature = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const projectId = +(req.query["project-id"] as string);
    if (isNaN(projectId)) throw "Invalid Project ID";

    const [project, currentSell] = await Promise.all([
      getProjectById(projectId).catch(() => null),
      getCurrentSale(projectId).catch(() => null),
    ]);

    if (!project) throw "Invalid Project";
    if (!currentSell) throw "Current Sale Not Found";

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
    const cookieAddress = getCookieWallet(getHttpCookie(req, res));
    await prisma.user.findFirstOrThrow({
      where: { walletAddress: cookieAddress },
    });
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
