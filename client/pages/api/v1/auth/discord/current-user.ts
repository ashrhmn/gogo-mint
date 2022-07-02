import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { getLoggedInUser } from "../../../../../controllers/User";

export default nextConnect<NextApiRequest, NextApiResponse>().get(
  getLoggedInUser
);
