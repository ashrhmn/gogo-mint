import { ContractFile, CompileError } from "../types";
import tsolc from "types-solc";
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
