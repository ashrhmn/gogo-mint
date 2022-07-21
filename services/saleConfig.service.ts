import { isAddress, keccak256 } from "ethers/lib/utils";
import MerkleTree from "merkletreejs";
import { ISaleConfigInput } from "../types";
import {
  getSaleConfigHash,
  getSolVersionConfig,
} from "../utils/Solidity.utils";
import { bufferTohex } from "../utils/String.utils";
import { prisma } from "../lib/db";
import Cookies from "cookies";
import { getCookieWallet } from "./auth.service";
import { SaleConfig } from "@prisma/client";

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

export const updateSaleConfigs = async (
  projectId: number,
  saleConfigs: SaleConfig[],
  cookies: Cookies
) => {
  const cookieAddress = getCookieWallet(cookies);
  const project = await prisma.project.findFirstOrThrow({
    where: { id: projectId },
    select: { owner: true },
  });
  if (project.owner.walletAddress !== cookieAddress)
    throw new Error("Project owner is not signed user");
  await prisma.saleConfig.deleteMany({ where: { projectId } });
  const result = await prisma.project.update({
    where: { id: projectId },
    data: {
      saleConfigs: {
        createMany: {
          skipDuplicates: true,
          data: saleConfigs.map((sc) => ({
            ...sc,
            startTime: +sc.startTime.toFixed(0),
            endTime: +sc.endTime.toFixed(0),
          })),
        },
      },
    },
  });
  return result;
};
