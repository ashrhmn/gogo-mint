import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { getUserByIdentifiers } from "../../../../controllers/user.controller";

export default nextConnect<NextApiRequest, NextApiResponse>().get(
  getUserByIdentifiers
);
