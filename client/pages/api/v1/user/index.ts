import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { getUserByIdentifiers } from "../../../../controllers/User";

export default nextConnect<NextApiRequest, NextApiResponse>().get(
  getUserByIdentifiers
);
