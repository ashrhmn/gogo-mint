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
import { EMPTY_WHITELIST_ROOT } from "../constants/configuration";
import * as MerkleTreeService from "./merkletree.service";

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

export const getSaleConfigProofByProjectId = async (
  projectId: number,
  saleIdentifier: string
) => {
  const configs = await prisma.saleConfig.findMany({
    where: { projectId },
    orderBy: { startTime: "asc" },
    include: {
      Project: { include: { owner: true } },
    },
  });
  const config = configs.find((c) => c.saleIdentifier === saleIdentifier);
  if (!config) throw new Error("config not found with identifier");
  const configInput: ISaleConfigInput = {
    enabled: config.enabled,
    endTime: config.endTime,
    maxMintInSale: config.maxMintInSale,
    maxMintPerWallet: config.maxMintPerWallet,
    mintCharge: config.mintCharge,
    saleType: config.saleType as "private" | "public",
    startTime: config.startTime,
    uuid: config.saleIdentifier,
    whitelistAddresses: config.whitelist,
  };
  const configInputs: ISaleConfigInput[] = configs.map((config) => ({
    enabled: config.enabled,
    endTime: config.endTime,
    maxMintInSale: config.maxMintInSale,
    maxMintPerWallet: config.maxMintPerWallet,
    mintCharge: config.mintCharge,
    saleType: config.saleType as "private" | "public",
    startTime: config.startTime,
    uuid: config.saleIdentifier,
    whitelistAddresses: config.whitelist,
  }));
  return getSaleConfigProof(configInputs, configInput);
};

export const getSaleConfigsByProjectId = async (projectId: number) => {
  await prisma.project.findFirstOrThrow({
    where: { id: projectId },
  });
  const configs = await prisma.saleConfig.findMany({
    where: { projectId },
    orderBy: { startTime: "asc" },
  });
  const checkedConfigs: (SaleConfig & { invalid?: boolean })[] = configs.map(
    (c, i) => ({
      ...c,
      invalid:
        configs.filter(
          (cf, idx) =>
            idx < i &&
            cf.startTime < c.startTime &&
            cf.endTime > c.endTime &&
            c.endTime !== 0
        ).length > 0,
    })
  );
  return checkedConfigs;
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

export const getCurrentSale = async (projectId: number) => {
  const now = +(Date.now() / 1000).toFixed(0);
  const scs = await prisma.saleConfig.findFirstOrThrow({
    where: {
      projectId,
      startTime: { lte: now },
      OR: [{ endTime: { equals: 0 } }, { endTime: { gte: now } }],
      enabled: true,
    },
    orderBy: { startTime: "asc" },
  });
  return scs;
};

export const getNextSale = async (projectId: number) => {
  const now = +(Date.now() / 1000).toFixed(0);
  const currentSale = await getCurrentSale(projectId);
  if (currentSale.endTime === 0)
    throw new Error("Current sale is never ending");
  const scs = await prisma.saleConfig.findFirstOrThrow({
    where: {
      projectId,
      // startTime: { gte: currentSale.endTime },
      OR: [
        { endTime: { equals: 0 } },
        {
          AND: [
            { endTime: { gte: now } },
            { endTime: { gt: currentSale.endTime } },
          ],
        },
      ],
      enabled: true,
      NOT: [{ saleIdentifier: { equals: currentSale.saleIdentifier } }],
    },
    orderBy: { startTime: "asc" },
  });
  return scs;
};

export const getWhitelistProofBySaleConfig = async (
  identifier: string,
  address: string
) => {
  const config = await prisma.saleConfig.findFirstOrThrow({
    where: { saleIdentifier: identifier },
  });
  if (config.saleType === "public") return [];
  if (config.whitelist.length === 0)
    throw new Error("Empty whitelist in private sale");
  return MerkleTreeService.getWhitelistProof(config.whitelist, address);
};
