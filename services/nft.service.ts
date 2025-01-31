import Cookies from "cookies";
import { prisma } from "../lib/db";
import { getCookieWallet } from "./auth.service";
import { NFT, Prisma } from "@prisma/client";
import {
  Collection1155__factory,
  Collection721__factory,
} from "../ContractFactory";
import { RPC_URLS } from "../constants/RPC_URL";
import { providers } from "ethers";
import { PUBLIC_URL } from "../constants/configuration";

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
      tokenId,
      name,
      backgroundColor,
      description,
      externalUrl,
      imageUrl,
      properties: JSON.stringify(
        properties
          ? properties
              .filter((p) => !!p.value)
              .map((p) => ({
                type: p.type,
                value: p.value,
              }))
          : []
      ),
    },
  });
};

export const addBatchNftsToProject = async (
  nftsData: {
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
    include: { owner: true, _count: { select: { nfts: true } } },
  });

  if (project.owner.walletAddress !== cookieAddress)
    throw "Logged in user is not project owner";

  const maxCapLimit = await (async () => {
    const rpcUrl = RPC_URLS[project.chainId || 0];
    if (!rpcUrl || !project.address) return -1;
    const contract =
      project.collectionType === "721"
        ? Collection721__factory.connect(
            project.address,
            new providers.StaticJsonRpcProvider(rpcUrl)
          )
        : project.collectionType === "1155"
        ? Collection1155__factory.connect(
            project.address,
            new providers.StaticJsonRpcProvider(rpcUrl)
          )
        : null;
    if (!contract) return -1;
    return await contract
      .state()
      .then((s) => s.maxMintCap)
      .then((v) => v.toNumber())
      .catch(() => -1);
  })();

  if (project._count.nfts + nftsData.length > maxCapLimit)
    throw "Max Cap Limit exceeds";

  const maxTokenId = await prisma.nFT
    .aggregate({
      _max: { tokenId: true },
      where: { projectId },
    })
    .then((res) => res._max.tokenId || 0);

  let tokenIdCounter = maxTokenId;

  return prisma.nFT.createMany({
    data: nftsData.map((nft) => ({
      projectId,
      // tokenId: nft.tokenId,
      tokenId: ++tokenIdCounter,
      name: nft.name,
      backgroundColor: nft.backgroundColor,
      description: nft.description,
      externalUrl: nft.externalUrl,
      imageUrl: nft.imageUrl,
      properties: JSON.stringify(
        nft.properties
          ? nft.properties
              .filter((p) => !!p.value)
              .map((p) => ({
                type: p.type,
                value: p.value,
              }))
          : []
      ),
    })),
  });

  // const promises = nftsData.map(
  //   (data) => () =>
  //     prisma.nFT
  //       .create({
  //         data: {
  //           projectId,
  //           // tokenId: data.tokenId,
  //           tokenId: ++tokenIdCounter,
  //           name: data.name,
  //           backgroundColor: data.backgroundColor,
  //           description: data.description,
  //           externalUrl: data.externalUrl,
  //           imageUrl: data.imageUrl,
  //           properties: JSON.stringify(
  //             data.properties
  //               ? data.properties
  //                   .filter((p) => !!p.value)
  //                   .map((p) => ({
  //                     type: p.type,
  //                     value: p.value,
  //                   }))
  //               : []
  //           ),
  //         },
  //       })
  //       .catch((err) => {
  //         console.log({
  //           error: "Error inserting NFT",
  //           reason: err,
  //           data: JSON.stringify(data),
  //         });
  //         return null;
  //       })
  // );

  // if (promises.length < 10) return await Promise.all(promises);
  // else {
  //   (async () => {
  //     let counter = 0;
  //     while (promises.length) {
  //       await Promise.all(promises.splice(0, 10));
  //       console.log(`Batch adding NFTs : ${++counter}`);
  //     }
  //     console.log("Complete Batch Add");
  //   })();
  //   return "queue";
  // }
};

export const getNftsByProjectId = async (
  projectId: number,
  skip: number,
  take: number
) => {
  return await prisma.nFT.findMany({
    where: { projectId },
    skip,
    take,
  });
};

export const getMetadata = async (nftId: number) => {
  const nft = await prisma.nFT.findFirstOrThrow({
    where: { id: nftId },
  });

  const properties = (() => {
    try {
      return JSON.parse(nft.properties) as { type: string; value: string }[];
    } catch (error) {
      return [];
    }
  })();

  return {
    name: nft.name,
    description: nft.description,
    external_link: nft.externalUrl,
    traits: properties.map((p) => ({ trait_type: p.type, value: p.value })),
    attributes: properties.map((p) => ({
      trait_type: p.type,
      value: p.value,
    })),
    image: nft.imageUrl,
    background_color: nft.backgroundColor,
  };
};

export const getOnChainMetadata = async (
  address: string,
  chainId: number,
  tokenId: number
) => {
  const nft = await prisma.nFT.findFirstOrThrow({
    where: {
      project: { address: { mode: "insensitive", equals: address }, chainId },
      tokenId,
    },
    include: { project: { select: { uid: true } } },
  });
  const properties = (() => {
    try {
      return JSON.parse(nft.properties) as { type: string; value: string }[];
    } catch (error) {
      return [];
    }
  })();
  return {
    name: nft.name,
    description: nft.description,
    external_link: nft.externalUrl || `${PUBLIC_URL}mint/${nft.project.uid}`,
    traits: properties.map((p) => ({ trait_type: p.type, value: p.value })),
    attributes: properties.map((p) => ({
      trait_type: p.type,
      value: p.value,
    })),
    image: nft.imageUrl,
    background_color: nft.backgroundColor,
  };
};

export const getOnChainHiddenMetadata = async (
  address: string,
  chainId: number
) => {
  const project = await prisma.project.findFirstOrThrow({
    where: {
      address: { mode: "insensitive", equals: address },
      chainId,
    },
  });
  return {
    name: `${project.name} item - hidden`,
    description: `This item is from ${project.name} but not revealed yet`,
    image: project.unrevealedImageUrl,
  };
};

export const updateTokenId = async (id: number, tokenId: number) => {
  return await prisma.nFT.update({ where: { id }, data: { tokenId } });
};

export const getRandomUnclaimedNftByProjectId = async (
  projectId: number,
  n: number = 1
) => {
  const itemCount = await prisma.nFT.count({
    where: { projectId, tokenId: null },
  });
  const skip = Math.max(0, Math.floor(Math.random() * itemCount) - n);
  return await prisma.nFT.findMany({
    where: { projectId, tokenId: null },
    skip,
    take: n,
    orderBy: { imageUrl: "desc" },
  });
};

export const updateTokenIdToRandom = async (
  fromTokenId: number,
  toTokenId: number,
  projectId: number
) => {
  if (fromTokenId > toTokenId) throw "fromTokeenId is less than toTokenId";
  const existingNftsWithTokenIdsCount = await prisma.nFT.count({
    where: {
      tokenId: {
        in: Array(toTokenId - fromTokenId + 1)
          .fill(0)
          .map((_, i) => i + fromTokenId),
      },
      projectId,
    },
  });

  if (existingNftsWithTokenIdsCount !== 0) throw "TokenId already exists";

  const updatedNfts = await Promise.all(
    (
      await getRandomUnclaimedNftByProjectId(
        projectId,
        toTokenId - fromTokenId + 1
      )
    ).map((nft, index) =>
      prisma.nFT.update({
        where: { id: nft.id },
        data: { tokenId: fromTokenId + index },
      })
    )
  );
  return updatedNfts;
};

export const deleteNftById = async (id: number, cookies: Cookies) => {
  const cookieWallet = getCookieWallet(cookies);
  const nft = await prisma.nFT.findUniqueOrThrow({
    where: { id },
    include: { project: { include: { owner: true } } },
  });
  if (cookieWallet !== nft.project.owner.walletAddress)
    throw "Logged in wallet not project owner";
  await prisma.nFT.delete({ where: { id } });
};

export const fixMissingTokenIds = async (projectId: number) => {
  const missingIds =
    await prisma.$queryRaw`SELECT "tokenId" FROM generate_series(1,(SELECT max("tokenId") FROM public.nfts WHERE "projectId"=${projectId})) "tokenId" EXCEPT SELECT "tokenId" FROM public.nfts  WHERE "projectId"=${projectId};`
      .then((res) => res as { tokenId: number }[])
      .then((res) => res.map((r) => r.tokenId))
      .catch(() => [] as number[]);

  const uniqueMissingIds = Array.from(new Set(missingIds));

  // console.log({ missingIds, uniqueMissingIds });

  if (uniqueMissingIds.length === 0) return;

  for (const id of uniqueMissingIds) {
    await prisma.$executeRaw`update nfts set "tokenId"=${id} where  "projectId"=${projectId} and "tokenId"=(SELECT max("tokenId") FROM public.nfts where "projectId"=${projectId}) AND NOT EXISTS (
      SELECT 1 FROM nfts WHERE "tokenId" = ${id} AND "projectId" = ${projectId}
   )`.catch(console.error);
    // console.log({ id });
  }
};
