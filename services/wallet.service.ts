import { Wallet } from "ethers";

export const getPublicAddressFromPrivateKey = (privateKey: string) => {
  const wallet = new Wallet(privateKey);
  return wallet.address;
};
