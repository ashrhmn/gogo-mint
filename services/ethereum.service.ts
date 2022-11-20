import { ethers, providers } from "ethers";
import { isAddress } from "ethers/lib/utils";
import {
  CONTRACT_INTERFACE_ID,
  SUPPORTS_INTERFACE_ABI,
} from "../constants/configuration";
import { RPC_URLS } from "../constants/RPC_URL";

export const getSigner = (
  account: string | undefined,
  library: providers.JsonRpcProvider | undefined
): providers.JsonRpcSigner => {
  if (!account || typeof account !== "string") throw "Account is not string";
  if (!library) throw "Wallet is not connected, library undefined";
  return library.getSigner(account);
};

export const is721 = async (address: string, chainId: number) => {
  if (!isAddress(address)) throw "Invalid Token Gated Contract Address";
  const rpc = RPC_URLS[chainId];
  if (!rpc) throw "Network not supported";
  const contract = new ethers.Contract(
    address,
    SUPPORTS_INTERFACE_ABI,
    new ethers.providers.StaticJsonRpcProvider(rpc)
  );
  return await contract
    .supportsInterface(CONTRACT_INTERFACE_ID.ERC_721_INTERFACE_ID)
    .catch(() => false);
};
