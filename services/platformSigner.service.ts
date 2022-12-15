import { Wallet } from "ethers";
import { arrayify, isAddress, solidityKeccak256 } from "ethers/lib/utils";
import { v4 } from "uuid";
import { PLATFORM_SIGNER_PRIVATE_KEY } from "../constants/configuration";

export const getRandomMessageSignature = async () => {
  const privateKey = PLATFORM_SIGNER_PRIVATE_KEY;
  const wallet = new Wallet(privateKey);
  const message = v4();

  const signature = await wallet.signMessage(
    arrayify(solidityKeccak256(["string"], [message]))
  );
  return { message, signature };
};

export const getMultipleRandomMessageSignature = async (n: number) => {
  return await Promise.all(
    Array(n)
      .fill(0)
      .map((_) => getRandomMessageSignature())
  );
};

export const getMintSignature = async ({
  account,
  mintCount,
}: {
  account: string;
  mintCount: number;
}) => {
  if (!isAddress(account)) throw "Invalid Wallet Address : mint signature";
  const privateKey = PLATFORM_SIGNER_PRIVATE_KEY;
  const wallet = new Wallet(privateKey);
  const message = v4();

  const signature = await wallet.signMessage(
    arrayify(
      solidityKeccak256(
        ["address", "string", "uint256"],
        [account, message, mintCount]
      )
    )
  );
  return { message, signature };
};
