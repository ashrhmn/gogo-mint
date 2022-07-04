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
          data: properties.map((p) => ({
            type: p.type,
            value: p.value,
          })),
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
