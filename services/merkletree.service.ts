import { isAddress, keccak256 } from "ethers/lib/utils";
import MerkleTree from "merkletreejs";
import { bufferTohex } from "../utils/String.utils";
import { IWhiteList } from "../types";
import * as SolidityUtils from "../utils/Solidity.utils";

export const getWhitelistTree = (wls: IWhiteList[]) => {
  try {
    const validWls = wls.filter((wl) => isAddress(wl.address));
    if (wls.length !== validWls.length) throw "Some addresse(s) are invalid";

    const leaves = validWls.map((wl) =>
      keccak256(SolidityUtils.getWhitelistHash(wl))
    );
    return new MerkleTree(leaves, keccak256, { sortPairs: true });
  } catch (error) {
    console.log("Error generating whitelist tree : ", error);
    throw error;
  }
};

export const getWhitelistRoot = (wls: IWhiteList[]) => {
  try {
    const tree = getWhitelistTree(wls);
    return bufferTohex(tree.getRoot());
  } catch (error) {
    console.log("Error generating whitelist root : ", error);
    throw error;
  }
};

export const getWhitelistProof = (wls: IWhiteList[], wl: IWhiteList) => {
  try {
    const tree = getWhitelistTree(wls);
    return tree
      .getProof(keccak256(SolidityUtils.getWhitelistHash(wl)))
      .map((p) => bufferTohex(p.data));
  } catch (error) {
    console.log("Error generating proof : ", error);
    throw error;
  }
};
