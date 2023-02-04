import { keccak256 } from "ethers/lib/utils";
import MerkleTree from "merkletreejs";
import { ISaleConfigInput, IWhiteList } from "../types";
import {
  getSaleConfigHash,
  getSolVersionConfig,
} from "../utils/Solidity.utils";
import { bufferTohex } from "../utils/String.utils";
import { prisma } from "../lib/db";
import Cookies from "cookies";
import { getCookieWallet } from "./auth.service";
import { SaleConfig } from "@prisma/client";
import * as MerkleTreeService from "./merkletree.service";
import { getIfCached } from "../lib/redis";

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
      whitelist: { select: { address: true, limit: true } },
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
    tokenGatedAddress: config.tokenGatedAddress,
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
    tokenGatedAddress: config.tokenGatedAddress,
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
    include: { whitelist: true },
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
  saleConfigs: (SaleConfig & {
    whitelist: IWhiteList[];
  })[],
  cookies: Cookies
) => {
  const cookieAddress = getCookieWallet(cookies);
  const project = await prisma.project.findFirstOrThrow({
    where: { id: projectId },
    select: { owner: true },
  });
  if (project.owner.walletAddress !== cookieAddress)
    throw new Error("Project owner is not signed user");

  return await prisma.$transaction(async (tx) => {
    await tx.saleConfig.deleteMany({ where: { projectId } });
    const result = await tx.saleConfig.createMany({
      data: saleConfigs.map(
        ({
          enabled,
          endTime,
          maxMintInSale,
          maxMintPerWallet,
          mintCharge,
          saleIdentifier,
          saleType,
          startTime,
          tokenGatedAddress,
        }) => ({
          startTime: +startTime.toFixed(0),
          endTime: +endTime.toFixed(0),
          enabled,
          maxMintInSale,
          projectId,
          tokenGatedAddress,
          maxMintPerWallet,
          mintCharge,
          saleIdentifier,
          saleType,
        })
      ),
    });

    const createManyWhitelistData = await tx.saleConfig
      .findMany({
        where: { projectId },
        select: { id: true, saleIdentifier: true },
      })
      .then((res) =>
        res
          .map((asc) => ({
            saleConfigId: asc.id,
            wl:
              saleConfigs.find((sc) => sc.saleIdentifier === asc.saleIdentifier)
                ?.whitelist || [],
          }))
          .map(({ saleConfigId, wl }) => [
            ...wl.map((w) => ({ ...w, saleConfigId })),
          ])
          .reduce((prev, curr) => [...prev, ...curr], [])
      );

    await tx.whitelistLimits.createMany({
      data: createManyWhitelistData,
      skipDuplicates: true,
    });

    return result;
  });
};

export const getCurrentSale = async (projectId: number) => {
  const now = +(Date.now() / 1000).toFixed(0);
  const scs = await getIfCached({
    key: `current-sale:${projectId}:${now}`,
    ttl: 60,
    realtimeDataCb: () =>
      prisma.saleConfig.findFirstOrThrow({
        where: {
          projectId,
          startTime: { lte: now },
          OR: [{ endTime: { equals: 0 } }, { endTime: { gte: now } }],
          enabled: true,
        },
        orderBy: { startTime: "asc" },
        include: { whitelist: true },
      }),
  });
  return scs;
};

export const getNextSale = async (projectId: number) => {
  const now = +(Date.now() / 1000).toFixed(0);
  const currentSale = await getCurrentSale(projectId).catch((_err) => {
    return null;
  });
  if (!!currentSale && currentSale.endTime === 0)
    throw new Error("Current sale is never ending");
  return !!currentSale
    ? await prisma.saleConfig.findFirstOrThrow({
        where: {
          projectId,
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
        include: { whitelist: true },
      })
    : await prisma.saleConfig.findFirstOrThrow({
        where: {
          projectId,
          startTime: { gte: now },
          OR: [
            { endTime: { equals: 0 } },
            {
              AND: [{ endTime: { gte: now } }],
            },
          ],
          enabled: true,
        },
        orderBy: { startTime: "asc" },
        include: { whitelist: true },
      });
};

export const getCurrentAndNextSale = async (projectId: number) => {
  const now = +(Date.now() / 1000).toFixed(0);
  const currentSale = await getCurrentSale(projectId).catch((_err) => {
    return null;
  });
  if (!!currentSale && currentSale.endTime === 0)
    throw new Error("Current sale is never ending");
  const nextSale = !!currentSale
    ? await prisma.saleConfig
        .findFirstOrThrow({
          where: {
            projectId,
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
          include: { whitelist: true },
        })
        .catch(() => null)
    : await prisma.saleConfig
        .findFirstOrThrow({
          where: {
            projectId,
            startTime: { gte: now },
            OR: [
              { endTime: { equals: 0 } },
              {
                AND: [{ endTime: { gte: now } }],
              },
            ],
            enabled: true,
          },
          orderBy: { startTime: "asc" },
          include: { whitelist: true },
        })
        .catch(() => null);

  return { currentSale, nextSale };
};

export const getWhitelistProofBySaleConfig = async (
  identifier: string,
  address: string
) => {
  const config = await prisma.saleConfig.findFirstOrThrow({
    where: { saleIdentifier: identifier },
    include: { whitelist: { select: { address: true, limit: true } } },
  });
  if (config.saleType === "public") return [];
  if (config.whitelist.length === 0)
    throw new Error("Empty whitelist in private sale");
  return MerkleTreeService.getWhitelistProof(
    config.whitelist,
    config.whitelist.find((wl) => wl.address === address) || {
      address,
      limit: 0,
    }
  );
};
