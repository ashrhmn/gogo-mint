import { GetServerSidePropsContext, PreviewData } from "next";
import { ParsedUrlQuery } from "querystring";
import {
  getAccessTokenFromCookie,
  getHttpCookie,
} from "../utils/Request.utils";
import { getUserByAccessToken } from "./discord.service";
import { getProjectByChainAddress } from "./project.service";
import { getUserByDiscordIdentifiers } from "./user.service";

export const authorizeProject = async (
  context: GetServerSidePropsContext<ParsedUrlQuery, PreviewData>,
  contract: string,
  network: number
) => {
  const accessToken = getAccessTokenFromCookie(context.req);
  const cookie = getHttpCookie(context.req, context.res);
  if (!accessToken) {
    cookie.set("auth_page_message", "You must login to continue");
    return { props: {}, redirect: { destination: "/authenticate" } };
  }
  const user = await getUserByAccessToken(accessToken);
  if (!user) {
    cookie.set("auth_page_message", "You must login to continue");
    return { props: {}, redirect: { destination: "/authenticate" } };
  }
  const dbUser = await getUserByDiscordIdentifiers(
    user.username,
    user.discriminator
  );
  if (!dbUser) {
    cookie.set("auth_page_message", "You must login to continue");
    return { props: {}, redirect: { destination: "/authenticate" } };
  }
  const project = await getProjectByChainAddress(contract, network);
  if (!project) return { props: {}, redirect: { destination: `/404` } };
  if (project.userId !== dbUser.id) {
    cookie.set(
      "auth_page_message",
      "You are not allowed to view this page. Are you logged in to the correct user?"
    );
    return { props: {}, redirect: { destination: "/authenticate" } };
  }
  return project;
};
