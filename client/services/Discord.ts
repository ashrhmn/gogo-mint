import Cookies from "cookies";
import { NextApiResponse, NextApiRequest } from "next";
import { ACCESS_TOKEN_COOKIE_KEY } from "../constants/configuration";

export const removeDiscordAccessToken = (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const cookie = new Cookies(req, res);
  cookie.set(ACCESS_TOKEN_COOKIE_KEY, "", {
    expires: new Date(Date.now() - 86400),
  });
};
