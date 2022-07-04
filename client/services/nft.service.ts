import { prisma } from "../lib/db";

export const addNftToProject = async (
  projectId: number,
  signature: string,
  metadataUri: string,
  tokenId: number
) => {
  return await prisma.nFT.create({
    data: { projectId, signature, metadataUri, tokenId },
  });
};
