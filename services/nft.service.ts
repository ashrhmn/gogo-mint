import Cookies from "cookies";
import { prisma } from "../lib/db";
import { getCookieWallet } from "./auth.service";
import { NFT, Prisma } from "@prisma/client";

export const addNftsInQueue = async (
  promises: Prisma.Prisma__NFTClient<NFT>[],
  limit: number
) => {
  while (promises.length) {
    await Promise.all(promises.splice(0, limit));
    console.log("Done 10");
  }
};

export const addNftToProject = async (
  projectId: number,
  signature: string,
  message: string,
  tokenId: number,
  name: string,
  description: string,
  properties: { type: string; value: string }[],
  backgroundColor: string,
  externalUrl: string,
  imageUrl: string,
  cookies: Cookies
) => {
  const cookieAddress = getCookieWallet(cookies);
  const project = await prisma.project.findFirstOrThrow({
    where: { id: projectId },
    include: { owner: true },
  });
  if (project.owner.walletAddress !== cookieAddress)
    throw "Logged in user is not project owner";
  return await prisma.nFT.create({
    data: {
      projectId,
      signature,
      message,
      tokenId,
      name,
      backgroundColor,
      description,
      externalUrl,
      imageUrl,
      properties: {
        createMany: {
          data: properties
            ? properties
                .filter((p) => !!p.value)
                .map((p) => ({
                  type: p.type,
                  value: p.value,
                }))
            : [],
          skipDuplicates: true,
        },
      },
    },
  });
};

export const addBatchNftsToProject = async (
  nftsData: {
    signature: string;
    message: string;
    tokenId: number;
    name: string;
    description: string;
    properties: { type: string; value: string }[];
    backgroundColor: string;
    externalUrl: string;
    imageUrl: string;
  }[],
  cookies: Cookies,
  projectId: number
) => {
  const cookieAddress = getCookieWallet(cookies);
  const project = await prisma.project.findFirstOrThrow({
    where: { id: projectId },
    include: { owner: true },
  });
  if (project.owner.walletAddress !== cookieAddress)
    throw "Logged in user is not project owner";

  const promises = nftsData.map((data) =>
    prisma.nFT.create({
      data: {
        projectId,
        signature: data.signature,
        message: data.message,
        tokenId: data.tokenId,
        name: data.name,
        backgroundColor: data.backgroundColor,
        description: data.description,
        externalUrl: data.externalUrl,
        imageUrl: data.imageUrl,
        properties: {
          createMany: {
            data: data.properties
              ? data.properties
                  .filter((p) => !!p.value)
                  .map((p) => ({
                    type: p.type,
                    value: p.value,
                  }))
              : [],
            skipDuplicates: true,
          },
        },
      },
    })
  );

  if (promises.length < 10) return await Promise.all(promises);
  else {
    (async () => {
      let counter = 0;
      while (promises.length) {
        await Promise.all(promises.splice(0, 10));
        console.log(`Batch adding NFTs : ${++counter}`);
      }
      console.log("Complete Batch Add");
    })();
    return "queue";
  }
};

export const getNftsByProjectId = async (
  projectId: number,
  skip: number,
  take: number
) => {
  return await prisma.nFT.findMany({
    include: { properties: true },
    where: { projectId },
    skip,
    take,
  });
};

export const updateNftCreationSignature = async (
  id: number,
  signature: string
) => {
  return await prisma.nFT.update({ where: { id }, data: { signature } });
};

export const getMetadata = async (nftId: number) => {
  const nft = await prisma.nFT.findFirstOrThrow({
    where: { id: nftId },
    include: { properties: true },
  });
  return {
    name: nft.name,
    description: nft.description,
    external_link: nft.externalUrl,
    traits: nft.properties.map((p) => ({ trait_type: p.type, value: p.value })),
    attributes: nft.properties.map((p) => ({
      trait_type: p.type,
      value: p.value,
    })),
    image: nft.imageUrl,
    background_color: nft.backgroundColor,
  };
};

export const updateTokenId = async (id: number, tokenId: number) => {
  return await prisma.nFT.update({ where: { id }, data: { tokenId } });
};
