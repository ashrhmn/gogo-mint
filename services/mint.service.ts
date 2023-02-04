import * as SaleConfigService from "./saleConfig.service";
import * as PlatformSignerService from "./platformSigner.service";
import { prisma } from "../lib/db";
import { getSolVersionConfig } from "../utils/Solidity.utils";
import { parseEther } from "ethers/lib/utils";
import { multiply } from "../utils/Number.utils";
import { getIfCached } from "../lib/redis";

export const prepareMintData = async (
  projectId: number,
  walletAddress: string,
  mintCount: number
) => {
  const currentSale = await SaleConfigService.getCurrentSale(projectId).catch(
    () => null
  );
  if (!currentSale) throw new Error("No sale running");

  const [userLimit, { message, signature }, saleConfigProof] =
    await Promise.all([
      getIfCached({
        key: `user-limit-${projectId}-${currentSale.saleIdentifier}-${walletAddress}`,
        ttl: 120,
        realtimeDataCb: () =>
          prisma.whitelistLimits
            .findFirstOrThrow({
              where: { address: walletAddress, saleConfigId: currentSale.id },
              select: { address: true, limit: true },
            })
            .catch(() => ({ address: walletAddress, limit: 0 })),
      }),
      PlatformSignerService._getMintSignature(walletAddress, mintCount),
      getIfCached({
        key: `config-proof-${projectId}-${currentSale.saleIdentifier}`,
        ttl: 30,
        realtimeDataCb: () =>
          SaleConfigService.getSaleConfigProofByProjectId(
            projectId,
            currentSale.saleIdentifier
          ),
      }),
    ]);

  const whitelistProof = await getIfCached({
    key: `whitelist-proof-${projectId}-${currentSale.saleIdentifier}-${walletAddress}`,
    ttl: 30,
    realtimeDataCb: async () =>
      SaleConfigService.getWhitelistProof(
        currentSale.saleType,
        currentSale.whitelist,
        userLimit
      ),
  });

  const config = getSolVersionConfig({
    enabled: currentSale.enabled,
    endTime: currentSale.endTime,
    maxMintInSale: currentSale.maxMintInSale,
    maxMintPerWallet: currentSale.maxMintPerWallet,
    mintCharge: currentSale.mintCharge,
    saleType: currentSale.saleType as "public" | "private",
    startTime: currentSale.startTime,
    uuid: currentSale.saleIdentifier,
    whitelistAddresses: currentSale.whitelist,
    tokenGatedAddress: currentSale.tokenGatedAddress,
  });

  const mintChargeInWei = parseEther(
    (+multiply(currentSale.mintCharge, mintCount).toFixed(18)).toString()
  ).toString();

  return {
    config,
    message,
    signature,
    whitelistProof,
    mintChargeInWei,
    whitelistMintLimit: userLimit.limit,
    saleConfigProof,
  };
};
