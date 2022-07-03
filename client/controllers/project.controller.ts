import { NextApiRequest, NextApiResponse } from "next";
import { errorResponse, successResponse } from "../utils/Response.utils";
import * as ProjectService from "../services/project.service";
import { getAccessTokenFromCookie } from "../utils/Request";

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
    const { name, address, description, imageUrl, whitelist } = req.body;
    if (!name || typeof name !== "string")
      return res.json(errorResponse("Name is required"));

    const project = await ProjectService.createProjectForLoggedInUser(
      name,
      address,
      description,
      imageUrl,
      whitelist,
      accessToken
    );
    return res.json(successResponse(project));
  } catch (error) {
    return res.json(errorResponse(error));
  }
};
