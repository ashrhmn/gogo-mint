import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import {
  getProjectById,
  updateProjectById,
} from "../../../../controllers/project.controller";

export default nextConnect<NextApiRequest, NextApiResponse>()
  .get(getProjectById)
  .put(updateProjectById);
