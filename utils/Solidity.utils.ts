import {
  ContractFile,
  CompileError,
  ISaleConfigSol,
  ISaleConfigInput,
} from "../types";
import tsolc from "types-solc";
import {
  isAddress,
  keccak256,
  parseEther,
  solidityKeccak256,
} from "ethers/lib/utils";
import { EMPTY_WHITELIST_ROOT } from "../constants/configuration";
import { bufferTohex } from "./String.utils";
import MerkleTree from "merkletreejs";
const solc: any = require("solc");

export function getContractFile(
  name: string,
  source: string
): undefined | ContractFile {
  const input = {
    language: "Solidity",
    sources: {
      [name + ".sol"]: {
        content: source,
      },
    },
    settings: {
      outputSelection: {
        "*": {
          "*": ["*"],
        },
      },
    },
  };

  const tempFile = JSON.parse((solc as tsolc).compile(JSON.stringify(input)));
  //   console.log(tempFile);

  const contractFile = tempFile?.contracts?.[name + ".sol"]?.[name];
  const errorsAndWarnings: CompileError[] = tempFile?.errors
    ? tempFile.errors
    : [];
  const errors = errorsAndWarnings.filter((e) => e.severity === "error");
  if (!contractFile || errors.length > 0) throw tempFile.errors;
  return contractFile;
}

export const getSaleConfigHash = (conf: ISaleConfigSol) =>
  solidityKeccak256(
    [
      "string",
      "bool",
      "uint256",
      "uint256",
      "uint256",
      "bytes32",
      "uint256",
      "uint256",
      "address",
    ],
    [
      conf.saleIdentifier,
      conf.enabled,
      conf.startTime,
      conf.endTime,
      conf.mintCharge,
      conf.whitelistRoot,
      conf.maxMintPerWallet,
      conf.maxMintInSale,
      conf.tokenGatedAddress,
    ]
  );

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
  tokenGatedAddress: config.tokenGatedAddress,
});
