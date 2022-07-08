import { NextApiRequest, NextApiResponse } from "next";
import { errorResponse, successResponse } from "../utils/Response.utils";
import * as ProjectService from "../services/project.service";
import { getAccessTokenFromCookie } from "../utils/Request";
import { isAddress } from "ethers/lib/utils";
import { json } from "stream/consumers";

export const getAllProjectsByDiscordId = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const { username, discriminator } = req.query;
  if (
    !username ||
    typeof username !== "string" ||
    !discriminator ||
    typeof discriminator !== "string"
  )
    return res.json(errorResponse("Invalid Params"));

  const projects = await ProjectService.getAllProjectsByDiscordId(
    username,
    discriminator
  );

  return res.json(successResponse(projects));
};

export const addNewProject = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const accessToken = getAccessTokenFromCookie(req);
    if (!accessToken)
      return res.json(errorResponse("Access token not provided"));
    const {
      name,
      address,
      description,
      imageUrl,
      whitelist,
      chainId,
      collectionType,
    } = req.body;
    if (!name || typeof name !== "string")
      return res.json(errorResponse("Name is required"));

    const project = await ProjectService.createProjectForLoggedInUser(
      name,
      address,
      description,
      imageUrl,
      whitelist,
      accessToken,
      chainId,
      collectionType
    );
    return res.json(successResponse(project));
  } catch (error) {
    console.log("Error Saving project : ", error);

    return res.json(errorResponse(error));
  }
};

export const updateProjectOwner = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const { projectAddress, projectChainId, ownerAddress } = req.body;
  if (
    !projectAddress ||
    typeof projectAddress != "string" ||
    !isAddress(projectAddress)
  )
    return res.json(errorResponse("Invalid project address"));
  if (!projectChainId || typeof projectChainId != "number")
    return res.json(errorResponse("Invalid project chain ID"));
  if (
    !ownerAddress ||
    typeof ownerAddress !== "string" ||
    !isAddress(ownerAddress)
  )
    return res.json(errorResponse("Invalid owner address"));
  try {
    return res.json(
      successResponse(
        await ProjectService.updateProjectOwner(
          projectAddress,
          projectChainId,
          ownerAddress
        )
      )
    );
  } catch (error) {
    return res.json(errorResponse(error));
  }
};

export const getProjectById = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const id = req.query.id;
    if (!id || typeof id !== "string" || isNaN(+id))
      return res.json(errorResponse("Invalid ID"));
    return res.json(successResponse(await ProjectService.getProjectById(+id)));
  } catch (error) {
    return res.json(errorResponse(error));
  }
};
export const updateProjectById = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const id = req.query.id;
    if (!id || typeof id !== "string" || isNaN(+id))
      return res.json(errorResponse("Invalid ID"));
    const {
      address,
      chainId,
      collectionType,
      description,
      imageUrl,
      name,
      userId,
      whitelist,
    } = req.body;
    return res.json(
      successResponse(
        await ProjectService.updateProjectById(
          +id,
          address,
          chainId,
          collectionType,
          description,
          imageUrl,
          name,
          userId,
          whitelist
        )
      )
    );
  } catch (error) {
    return res.json(errorResponse(error));
  }
};
