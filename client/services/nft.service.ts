import { prisma } from "../lib/db";

export const addNftToProject = async (
  projectId: number,
  signature: string,
  tokenId: number,
  name: string,
  description: string,
  properties: { type: string; value: string }[],
  backgroundColor: string,
  externalUrl: string,
  imageUrl: string
) => {
  return await prisma.nFT.create({
    data: {
      projectId,
      signature,
      tokenId,
      name,
      backgroundColor,
      description,
      externalUrl,
      imageUrl,
      properties: {
        createMany: {
          data: properties
            ? properties.map((p) => ({
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

export const getNftsByProjectId = async (projectId: number) => {
  return await prisma.nFT.findMany({
    include: { properties: true },
    where: { projectId },
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
