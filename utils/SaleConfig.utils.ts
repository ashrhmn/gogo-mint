import { parseEther, isAddress, keccak256 } from "ethers/lib/utils";
import MerkleTree from "merkletreejs";
import { EMPTY_WHITELIST_ROOT } from "../constants/configuration";
import { ISaleConfigInput, ISaleConfigSol } from "../types";
import { bufferTohex } from "./String.utils";

export const getSolVersionConfig = (
  config: ISaleConfigInput
): ISaleConfigSol => ({
  saleIdentifier: config.uuid,
  enabled: config.enabled,
  endTime: +config.endTime.toFixed(0),
  startTime: +config.startTime.toFixed(0),
  maxMintInSale: config.maxMintInSale,
  maxMintPerWallet: config.maxMintPerWallet,
  mintCharge: parseEther(config.mintCharge.toString()).toString(),
  tokenGatedAddress: config.tokenGatedAddress,
  whitelistRoot:
    config.saleType === "public"
      ? EMPTY_WHITELIST_ROOT
      : bufferTohex(
          new MerkleTree(
            config.whitelistAddresses
              .filter((address) => isAddress(address))
              .map((address) => keccak256(address)),
            keccak256,
            { sortPairs: true }
          ).getRoot()
        ),
});
