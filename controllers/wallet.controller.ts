import { isAddress } from "ethers/lib/utils";
import { NextApiRequest, NextApiResponse } from "next";
import assert from "node:assert";
import * as AuthService from "../services/auth.service";
import { getHttpCookie } from "../utils/Request.utils";
import { errorResponse, successResponse } from "../utils/Response.utils";
import { z } from "zod";
import { handleControllerError } from "../utils/Error.utils";

export const walletSignLogin = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const { address, signature } = req.body;
    assert(address && isAddress(address), "Invalid Address");
    assert(signature && typeof signature === "string", "Invalid Signature");
    const user = await AuthService.walletSignLogin(
      address,
      signature,
      getHttpCookie(req, res)
    );
    return res.json(successResponse(user));
  } catch (error) {
    return res.status(500).json(errorResponse(error));
  }
};

export const linkDiscordToWallet = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const { username, discriminator, address } = z
      .object({
        username: z.string(),
        discriminator: z.number().positive().int(),
        address: z
          .string()
          .refine((a) => isAddress(a), { message: "not an address" }),
      })
      .parse(req.body);
    return res.json(
      successResponse(
        await AuthService.updateDiscordInfo(username, discriminator, address)
      )
    );
  } catch (error) {
    console.log("linkDiscordToWallet Error : ", error);
    return res.status(500).json(errorResponse(error));
  }
};

export const getCurrentlySignedWallet = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    return res.json(
      successResponse(AuthService.getCookieWallet(getHttpCookie(req, res)))
    );
  } catch (error) {
    handleControllerError(res, error);
  }
};
