import { NextApiRequest } from "next";
import { ACCESS_TOKEN_COOKIE_KEY } from "../constants/configuration";
import { decryptAccessToken } from "./String.utils";

export const getAccessTokenFromCookie = (req: NextApiRequest) => {
  const encryptedAccessToken =
    req.cookies[ACCESS_TOKEN_COOKIE_KEY] || req.headers.token;
  if (!encryptedAccessToken || typeof encryptedAccessToken !== "string")
    return null;
  return decryptAccessToken(encryptedAccessToken);
};
