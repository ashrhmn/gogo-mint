import { NextApiRequest, NextApiResponse } from "next";
import { getAccessTokenFromCookie } from "../utils/Request";
import { errorResponse, successResponse } from "../utils/Response.utils";
import * as NftService from "../services/nft.service";

export const addNftAsDiscordUser = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const accessToken = getAccessTokenFromCookie(req);
    if (!accessToken)
      return res.json(errorResponse("Access token not provided"));
    const {
      projectId,
      signature,
      tokenId,
      name,
      description,
      properties,
      backgroundColor,
      externalUrl,
      imageUrl,
    } = req.body;

    if (!projectId || typeof projectId !== "number")
      return res.json(errorResponse("Invalid project ID"));
    if (!name || typeof name !== "string")
      return res.json(errorResponse("Invalid NFT name"));

    const newNft = await NftService.addNftToProject(
      +projectId,
      signature,
      tokenId,
      name,
      description,
      properties,
      backgroundColor,
      externalUrl,
      imageUrl
    );
    return res.json(successResponse(newNft));
  } catch (err) {
    console.log("Error creating NFT : ", err);
    return res.json(errorResponse(err));
  }
};
