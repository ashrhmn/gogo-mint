import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { deleteRoleIntegrationById } from "../../../../../controllers/project.controller";

export default nextConnect<NextApiRequest, NextApiResponse>().delete(
  deleteRoleIntegrationById
);
