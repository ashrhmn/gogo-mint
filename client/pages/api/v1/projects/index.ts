import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { getAllProjectsByDiscordId } from "../../../../controllers/project.controller";

export default nextConnect<NextApiRequest, NextApiResponse>().get(
  getAllProjectsByDiscordId
);
