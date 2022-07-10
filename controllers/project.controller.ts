import { NextApiRequest, NextApiResponse } from "next";
import { errorResponse, successResponse } from "../utils/Response.utils";
import * as ProjectService from "../services/project.service";
import { getAccessTokenFromCookie } from "../utils/Request.utils";
import { isAddress } from "ethers/lib/utils";
import * as MerkleService from "../services/merkletree.service";

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
      uid,
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
          whitelist,
          uid
        )
      )
    );
  } catch (error) {
    return res.json(errorResponse(error));
  }
};

export const projectExistsWithUid = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const uid = req.query.uid;
    if (!uid || typeof uid !== "string")
      return res.json(errorResponse("Invalid Project UID"));
    return res.json(
      successResponse(await ProjectService.projectExistsWithUid(uid))
    );
  } catch (error) {
    console.log("Error : ", error);
    return res.json(errorResponse(error));
  }
};

export const getProjectByUid = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const uid = req.query.uid;
    if (!uid || typeof uid !== "string")
      return res.json(errorResponse("Invalid UID"));
    return res.json(successResponse(await ProjectService.getProjectByUid(uid)));
  } catch (error) {
    return res.json(errorResponse(error));
  }
};

export const getProofFromProjectId = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const { id, address } = req.query;
    if (!id || typeof id !== "string")
      return res.json(errorResponse("Invalid ID"));
    if (!address || typeof address !== "string")
      return res.json(errorResponse("Invalid Address"));
    const project = await ProjectService.getProjectById(+id);
    if (!project)
      return res.json(errorResponse(`Project not found with id ${id}`));
    const proof = MerkleService.getWhitelistProof(project.whitelist, address);
    return res.json(successResponse(proof));
  } catch (error) {
    console.log(error);
    return res.json(errorResponse(error));
  }
};
