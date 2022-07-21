import { keccak256 } from "ethers/lib/utils";
import MerkleTree from "merkletreejs";
import { ISaleConfigInput } from "../types";
import {
  getSaleConfigHash,
  getSolVersionConfig,
} from "../utils/Solidity.utils";
import { bufferTohex } from "../utils/String.utils";
import { prisma } from "../lib/db";

export const getSaleConfigTree = (saleConfigs: ISaleConfigInput[]) => {
  return new MerkleTree(
    saleConfigs.map((saleconfig) =>
      keccak256(getSaleConfigHash(getSolVersionConfig(saleconfig)))
    ),
    keccak256,
    { sortPairs: true }
  );
};

export const getSaleConfigRoot = (saleConfigs: ISaleConfigInput[]) => {
  return bufferTohex(getSaleConfigTree(saleConfigs).getRoot());
};

export const getSaleConfigProof = (
  saleConfigs: ISaleConfigInput[],
  saleConfig: ISaleConfigInput
) => {
  return getSaleConfigTree(saleConfigs)
    .getProof(keccak256(getSaleConfigHash(getSolVersionConfig(saleConfig))))
    .map((p) => bufferTohex(p.data));
};

export const getSaleConfigsByProjectId = async (projectId: number) => {
  await prisma.project.findFirstOrThrow({
    where: { id: projectId },
  });
  return await prisma.saleConfig.findMany({ where: { projectId } });
};
