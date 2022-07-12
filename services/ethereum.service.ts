import { providers } from "ethers";

export const getSigner = (
  account: string | undefined,
  library: providers.JsonRpcProvider | undefined
): providers.JsonRpcSigner => {
  if (!account || typeof account !== "string") throw "Account is not string";
  if (!library) throw "Wallet is not connected, library undefined";
  return library.getSigner(account);
};
