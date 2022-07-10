import { NextApiRequest, NextApiResponse } from "next";
import { getAccessTokenFromCookie } from "../utils/Request.utils";
import { errorResponse, successResponse } from "../utils/Response.utils";
import * as NftService from "../services/nft.service";
import { getUserByAccessToken } from "../services/discord.service";

export const addNftAsDiscordUser = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
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

export const updateNftCreationSignature = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const accessToken = getAccessTokenFromCookie(req);
    if (!accessToken)
      return res.json(errorResponse("Access Token not provided"));
    const { id, signature } = req.body;
    if (!id || typeof id !== "number")
      return res.json(errorResponse("Invalid id"));
    if (!signature || typeof signature !== "string")
      return res.json(errorResponse("Invalid Signature"));
    const user = await getUserByAccessToken(accessToken);
    if (!user) return res.json(errorResponse("Invalid Access token"));

    const result = await NftService.updateNftCreationSignature(id, signature);
    return res.json(successResponse(result));
  } catch (error) {
    console.log("Updating signature error : ", error);
    return res.json(errorResponse(error));
  }
};

export const getNftMetadata = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const id = req.query.item;
    if (!id || typeof id != "string" || isNaN(+id))
      return res.json(errorResponse("Invalid ID"));
    return res.json(successResponse(await NftService.getMetadata(+id)));
  } catch (error) {
    console.log("Get metadata error : ", error);
    return res.json(errorResponse(error));
  }
};

export const updateTokenId = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const { id, tokenId } = req.body;
    if (!id || typeof id !== "number")
      return res.json(errorResponse("Invalid ID"));
    if (typeof tokenId !== "number")
      return res.json(errorResponse("Invalid TokenID"));
    return res.json(
      successResponse(await NftService.updateTokenId(id, tokenId))
    );
  } catch (error) {
    console.log("Error updating token ID");
    return res.json(errorResponse(error));
  }
};
