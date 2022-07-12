import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { addNewProject } from "../../../../controllers/project.controller";

export default nextConnect<NextApiRequest, NextApiResponse>().post(
  addNewProject
);
