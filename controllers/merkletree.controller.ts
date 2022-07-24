import { NextApiRequest, NextApiResponse } from "next";
import { getWhitelistRoot } from "../services/merkletree.service";
import { errorResponse, successResponse } from "../utils/Response.utils";

export const getMerkletreeRoot = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const addresses = req.body.addresses;
  if (!(addresses && addresses[0] && typeof addresses[0] == "string"))
    return res.status(400).json(errorResponse("Invalid address format"));
  try {
    const root = getWhitelistRoot(addresses);
    return res.json(successResponse(root));
  } catch (error) {
    return res.status(500).json(errorResponse(error));
  }
};
