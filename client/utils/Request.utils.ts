import Cookies from "cookies";
import { ACCESS_TOKEN_COOKIE_KEY } from "../constants/configuration";
import { NextOrIncomingMessage, NextOrServerResponse } from "../types";
import { decryptAccessToken } from "./String.utils";

export const getAccessTokenFromCookie = (req: NextOrIncomingMessage) => {
  const encryptedAccessToken =
    req.cookies[ACCESS_TOKEN_COOKIE_KEY] || req.headers.token;
  if (!encryptedAccessToken || typeof encryptedAccessToken !== "string")
    return null;
  return decryptAccessToken(encryptedAccessToken);
};

export const getHttpCookie = (
  req: NextOrIncomingMessage,
  res: NextOrServerResponse
) => new Cookies(req, res);
