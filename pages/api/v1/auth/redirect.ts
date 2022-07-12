import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { redirectToAuthenticateWithMsg } from "../../../../controllers/auth.controller";

export default nextConnect<NextApiRequest, NextApiResponse>().get(
  redirectToAuthenticateWithMsg
);
