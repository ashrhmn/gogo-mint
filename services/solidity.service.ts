import { hashMessage, isAddress, recoverAddress } from "ethers/lib/utils";
import { getMessageToSignOnAuth } from "../constants/configuration";
import { ContractFile } from "../types";
import { getContractFile } from "../utils/Solidity.utils";

export const getAbiEvmCodeFromSolidity = (name: string, source: string) => {
  try {
    const compile = getContractFile(name, source) as ContractFile;
    return { abi: compile.abi, bytecode: compile.evm.bytecode.object };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const recoverSignerAddress = (signature: string, signer: string) => {
  if (!signer || typeof signer !== "string" || !isAddress(signer))
    throw "signer is not an address";
  return recoverAddress(hashMessage(getMessageToSignOnAuth(signer)), signature);
};

export const verifySignature = (signature: string, signer: string) => {
  return recoverSignerAddress(signature, signer) === signer;
};
