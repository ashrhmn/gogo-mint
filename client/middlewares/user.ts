import { NextApiRequest, NextApiResponse } from "next";
import { NextHandler } from "next-connect";
import { getUserByAccessToken } from "../services/discord.service";
import { getUserByDiscordIdentifiers } from "../services/user.service";
import { getAccessTokenFromCookie, getHttpCookie } from "../utils/Request";
import { errorResponse } from "../utils/Response.utils";

const onlyValidUser = async (
  req: NextApiRequest,
  res: NextApiResponse,
  next: NextHandler
) => {
  try {
    const accessToken = getAccessTokenFromCookie(req);
    if (!accessToken)
      return res.json(errorResponse("Access Token not provided"));
    const user = await getUserByAccessToken(accessToken);
    if (!user) return res.json(errorResponse("Invalid access token"));
    const dbUser = await getUserByDiscordIdentifiers(
      user.username,
      user.discriminator
    );
    if (!dbUser) {
      const cookie = getHttpCookie(req, res);
      cookie.set("auth_page_message", "You must login to continue");
      return res.redirect("/authenticate");
    }
    next();
  } catch (error) {
    console.log("Error only user middleware : ", error);
    return res.json(errorResponse(error));
  }
};

export default onlyValidUser;
