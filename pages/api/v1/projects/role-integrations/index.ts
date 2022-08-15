import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import {
  addRoleIntegrationToProject,
  getRoleIntegrationByProjectId,
} from "../../../../../controllers/project.controller";

export default nextConnect<NextApiRequest, NextApiResponse>()
  .post(addRoleIntegrationToProject)
  .get(getRoleIntegrationByProjectId);
