import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import {
  getProjectById,
  updateProjectById,
} from "../../../../controllers/project.controller";
import onlyProjectOwner from "../../../../middlewares/projectOwner";

export default nextConnect<NextApiRequest, NextApiResponse>()
  .use(onlyProjectOwner)
  .get(getProjectById)
  .put(updateProjectById);
