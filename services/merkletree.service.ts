import { isAddress, keccak256 } from "ethers/lib/utils";
import MerkleTree from "merkletreejs";
import { bufferTohex } from "../utils/String.utils";

export const getWhitelistTree = (addresses: string[]) => {
  try {
    const validAddresses = addresses.filter((address) => isAddress(address));
    if (addresses.length !== validAddresses.length)
      throw "Some addresse(s) are invalid";

    const leaves = validAddresses.map((address) => keccak256(address));
    return new MerkleTree(leaves, keccak256, { sortPairs: true });
  } catch (error) {
    console.log("Error generating whitelist tree : ", error);
    throw error;
  }
};

export const getWhitelistRoot = (addresses: string[]) => {
  try {
    const tree = getWhitelistTree(addresses);
    return bufferTohex(tree.getRoot());
  } catch (error) {
    console.log("Error generating whitelist root : ", error);
    throw error;
  }
};

export const getWhitelistProof = (addresses: string[], address: string) => {
  try {
    const tree = getWhitelistTree(addresses);
    return tree.getProof(keccak256(address)).map((p) => bufferTohex(p.data));
  } catch (error) {
    console.log("Error generating proof : ", error);
    throw error;
  }
};
