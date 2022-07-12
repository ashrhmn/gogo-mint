import { NextApiRequest, NextApiResponse } from "next";
import { NextHandler } from "next-connect";
import { getUserByAccessToken } from "../services/discord.service";
import { getProjectById } from "../services/project.service";
import { getUserByDiscordIdentifiers } from "../services/user.service";
import {
  getAccessTokenFromCookie,
  getHttpCookie,
} from "../utils/Request.utils";
import { errorResponse } from "../utils/Response.utils";

const onlyProjectOwnerAddress = async (
  req: NextApiRequest,
  res: NextApiResponse,
  next: NextHandler
) => {
  try {
    const id = req.query.id;
    if (!id || typeof id !== "string" || isNaN(+id))
      return res.json(errorResponse("Invalid Project ID"));
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
    if (!dbUser.walletAddress) {
      const cookie = getHttpCookie(req, res);
      cookie.set("auth_page_message", "You must link your wallet to continue");
      return res.redirect("/authenticate");
    }
    const project = await getProjectById(+id);
    if (!project) return res.json(errorResponse("Project not found"));
    if (project.owner.walletAddress !== dbUser.walletAddress)
      return res.json(errorResponse("Logged in user is not project owner"));
    next();
  } catch (error) {
    console.log("Error only user middleware : ", error);
    return res.json(errorResponse(error));
  }
};

export default onlyProjectOwnerAddress;
