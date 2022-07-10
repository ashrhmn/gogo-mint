import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { getLoggedInUser } from "../../../../../controllers/user.controller";

export default nextConnect<NextApiRequest, NextApiResponse>().get(
  getLoggedInUser
);
