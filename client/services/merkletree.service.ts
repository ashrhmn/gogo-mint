import { isAddress, keccak256 } from "ethers/lib/utils";
import MerkleTree from "merkletreejs";
import { bufferTohex } from "../utils/String.utils";

export const getWhitelistRoot = (addresses: string[]) => {
  try {
    const validAddresses = addresses.filter((address) => isAddress(address));
    if (addresses.length !== validAddresses.length)
      throw "Some addresse(s) are invalid";

    const leaves = validAddresses.map((address) => keccak256(address));
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const root = bufferTohex(tree.getRoot());
    return root;
  } catch (error) {
    console.log("Error generating whitelist root : ", error);
    throw error;
  }
};
