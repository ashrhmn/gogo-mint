import { NextApiRequest, NextApiResponse } from "next";
import { getHttpCookie } from "../utils/Request.utils";

export const redirectToAuthenticateWithMsg = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const message = req.query.message;
  if (typeof message === "string") {
    const cookies = getHttpCookie(req, res);
    cookies.set("auth_page_message", message);
  }
  return res.redirect("/authenticate");
};
