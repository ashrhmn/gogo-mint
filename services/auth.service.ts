import Cookies from "cookies";
import { GetServerSidePropsContext, PreviewData } from "next";
import { ParsedUrlQuery } from "querystring";
import {
  getMessageToSignOnAuth,
  WALLET_ADDRESS_COOKIE_KEY,
  WALLET_SIGN_COOKIE_KEY,
} from "../constants/configuration";
import {
  getAccessTokenFromCookie,
  getHttpCookie,
} from "../utils/Request.utils";
import { getUserByAccessToken } from "./discord.service";
import { getProjectByChainAddress } from "./project.service";
import { recoverSignerAddress, verifySignature } from "./solidity.service";
import { getUserByDiscordIdentifiers } from "./user.service";
import { prisma } from "../lib/db";
import { decryptString, encryptString } from "../utils/String.utils";
import assert from "assert";

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

export const walletSignLogin = async (
  address: string,
  signature: string,
  cookies: Cookies
) => {
  if (!verifySignature(signature, address)) throw "Signature Mismatch";
  cookies.set(WALLET_SIGN_COOKIE_KEY, encryptString(signature));
  cookies.set(WALLET_ADDRESS_COOKIE_KEY, encryptString(address));
  const user = await prisma.user.upsert({
    where: { walletAddress: address },
    update: { walletAddress: address },
    create: { walletAddress: address },
  });
  return user;
};

export const updateDiscordInfo = async (
  username: string,
  discriminator: number,
  address: string
) => {
  const existing = await prisma.user.findFirst({
    where: { discordDiscriminator: discriminator, discordUsername: username },
  });
  if (existing) {
    await prisma.user.update({
      where: {
        discordUsername_discordDiscriminator: {
          discordDiscriminator: discriminator,
          discordUsername: username,
        },
      },
      data: { discordDiscriminator: null, discordUsername: null },
    });
  }
  return await prisma.user.update({
    where: { walletAddress: address },
    data: { discordUsername: username, discordDiscriminator: discriminator },
  });
};

export const getCookieWallet = (cookies: Cookies) => {
  const encryptedSignature = cookies.get(WALLET_SIGN_COOKIE_KEY);
  const encryptedAddress = cookies.get(WALLET_ADDRESS_COOKIE_KEY);
  assert(
    encryptedSignature &&
      typeof encryptedSignature === "string" &&
      encryptedAddress &&
      typeof encryptedAddress === "string",
    "Sign Wallet Required"
  );
  const signature = decryptString(encryptedSignature);
  const address = decryptString(encryptedAddress);
  assert(verifySignature(signature, address), "Signature Verification Failed");
  return address;
};
