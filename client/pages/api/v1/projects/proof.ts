import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { getProofFromProjectId } from "../../../../controllers/project.controller";

export default nextConnect<NextApiRequest, NextApiResponse>().get(
  getProofFromProjectId
);
