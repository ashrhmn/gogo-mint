import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { projectExistsWithUid } from "../../../../../controllers/project.controller";
import onlyValidUser from "../../../../../middlewares/user";

export default nextConnect<NextApiRequest, NextApiResponse>()
  .use(onlyValidUser)
  .get(projectExistsWithUid);
