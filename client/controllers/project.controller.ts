import { NextApiRequest, NextApiResponse } from "next";
import { errorResponse, successResponse } from "../utils/Response.utils";
import * as ProjectService from "../services/project.service";

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
