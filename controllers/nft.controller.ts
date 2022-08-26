import { NextApiRequest, NextApiResponse } from "next";
import {
  getAccessTokenFromCookie,
  getHttpCookie,
} from "../utils/Request.utils";
import { errorResponse, successResponse } from "../utils/Response.utils";
import * as NftService from "../services/nft.service";
import { getUserByAccessToken } from "../services/discord.service";
import { z } from "zod";
import { isAddress } from "ethers/lib/utils";

export const addNftAsCookieWallet = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const {
      projectId,
      tokenId,
      name,
      description,
      properties,
      backgroundColor,
      externalUrl,
      imageUrl,
    } = req.body;

    if (!projectId || typeof projectId !== "number")
      return res.status(400).json(errorResponse("Invalid project ID"));
    if (!name || typeof name !== "string")
      return res.status(400).json(errorResponse("Invalid NFT name"));

    const newNft = await NftService.addNftToProject(
      +projectId,
      tokenId,
      name,
      description,
      properties,
      backgroundColor,
      externalUrl,
      imageUrl,
      getHttpCookie(req, res)
    );
    return res.json(successResponse(newNft));
  } catch (err) {
    console.log("Error creating NFT : ", err);
    return res.status(500).json(errorResponse(err));
  }
};

export const addBatchNftsAsCookieWallet = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const { projectId } = req.body;

    const nftData = req.body.nfts as {
      // signature: string;
      // message: string;
      tokenId: number;
      name: string;
      description: string;
      properties: { type: string; value: string }[];
      backgroundColor: string;
      externalUrl: string;
      imageUrl: string;
    }[];

    if (!projectId || typeof projectId !== "number")
      return res.status(400).json(errorResponse("Invalid project ID"));
    // if (!name || typeof name !== "string")
    //   return res.status(400).json(errorResponse("Invalid NFT name"));

    const newNft = await NftService.addBatchNftsToProject(
      nftData,
      getHttpCookie(req, res),
      projectId
    );
    return res.json(successResponse(newNft));
  } catch (err) {
    console.log("Error creating NFT : ", err);
    return res.status(500).json(errorResponse(err));
  }
};

// export const updateNftCreationSignature = async (
//   req: NextApiRequest,
//   res: NextApiResponse
// ) => {
//   try {
//     const accessToken = getAccessTokenFromCookie(req);
//     if (!accessToken)
//       return res.status(403).json(errorResponse("Access Token not provided"));
//     const { id, signature } = req.body;
//     if (!id || typeof id !== "number")
//       return res.status(400).json(errorResponse("Invalid id"));
//     if (!signature || typeof signature !== "string")
//       return res.status(400).json(errorResponse("Invalid Signature"));
//     const user = await getUserByAccessToken(accessToken);
//     if (!user)
//       return res.status(403).json(errorResponse("Invalid Access token"));

//     const result = await NftService.updateNftCreationSignature(id, signature);
//     return res.json(successResponse(result));
//   } catch (error) {
//     console.log("Updating signature error : ", error);
//     return res.status(500).json(errorResponse(error));
//   }
// };

export const getNftMetadata = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const {
      address,
      network: chainId,
      tokenId,
    } = z
      .object({
        address: z.string().refine(isAddress, "Not a valid address"),
        network: z
          .string()
          .refine((v) => !isNaN(+v), "Not a number")
          .transform((v) => +v),
        tokenId: z
          .string()
          .refine((v) => !isNaN(+v), "Not a number")
          .transform((v) => +v),
      })
      .parse(req.query);

    console.log({
      address,
      chainId,
      tokenId,
      from: req.headers.host,
      message: "Query for token",
    });

    return res.json(
      await NftService.getOnChainMetadata(address, chainId, tokenId)
    );
  } catch (error) {
    console.log("Get metadata error : ", error);
    return res.json(errorResponse(error));
  }
};

export const getHiddenNftMetadata = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const { address, network: chainId } = z
      .object({
        address: z.string().refine(isAddress, "Not a valid address"),
        network: z
          .string()
          .refine((v) => !isNaN(+v), "Not a number")
          .transform((v) => +v),
      })
      .parse(req.query);

    console.log({
      address,
      chainId,
      from: req.headers.host,
      message: "Query for hidden token",
    });

    return res.json(
      await NftService.getOnChainHiddenMetadata(address, chainId)
    );
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

export const getRandomUnclaimedNftByProjectId = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const { projectId, n } = req.query;
    if (!projectId || typeof projectId !== "string" || isNaN(+projectId))
      return res.status(400).json(errorResponse("Invalid project ID"));
    if (!n || typeof n !== "string" || isNaN(+n))
      return res.status(400).json(errorResponse("Invalid project NFT Count"));
    return res.json(
      successResponse(
        await NftService.getRandomUnclaimedNftByProjectId(+projectId, +n)
      )
    );
  } catch (error) {
    console.log("Error getting random unclaimed nft : ", error);
    return res.status(500).json(error);
  }
};

export const updateTokenIdToRandom = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const { projectId, fromTokenId, toTokenId } = req.body;
    if (!projectId || typeof projectId !== "number")
      return res.status(400).json(errorResponse("Invalid Project ID"));
    if (!fromTokenId || typeof fromTokenId !== "number")
      return res.status(400).json(errorResponse("Invalid FromTokenId"));
    if (!toTokenId || typeof toTokenId !== "number")
      return res.status(400).json(errorResponse("Invalid ToTokenId"));
    return res.json(
      successResponse(
        await NftService.updateTokenIdToRandom(
          fromTokenId,
          toTokenId,
          projectId
        )
      )
    );
  } catch (error) {
    console.log("Error updateing token id : ", error);
    return res.status(500).json(errorResponse(error));
  }
};

export const deleteNftById = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const id = req.query.id;

    if (typeof id !== "string" || isNaN(+id)) {
      return res.status(400).json(errorResponse("Invalid nft Id"));
    }
    const cookies = getHttpCookie(req, res);
    await NftService.deleteNftById(+id, cookies);
    return res.json(successResponse("Deleted"));
  } catch (error) {
    console.log("Error deleting nft : ", error);
    return res.status(500).json(errorResponse(error));
  }
};
