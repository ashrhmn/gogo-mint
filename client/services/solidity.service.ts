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
