import { ethers, Wallet } from "ethers";
import {
  arrayify,
  hashMessage,
  isAddress,
  recoverAddress,
  solidityKeccak256,
} from "ethers/lib/utils";
import { v4 } from "uuid";
import {
  getMessageToSignOnTokenGatedMint,
  PLATFORM_SIGNER_PRIVATE_KEY,
} from "../constants/configuration";
import { is721 } from "./ethereum.service";
import { getCurrentSale } from "./saleConfig.service";
import { prisma } from "../lib/db";
import { getProjectById } from "./project.service";
import { Collection721__factory } from "../ContractFactory";
import { RPC_URLS } from "../constants/RPC_URL";

function getTokenGatedLimit(_base: number) {
  if (_base > 39) return _base + 12;
  return _base + [0, 1, 3, 4, 6, 7, 9, 10][+(_base / 5).toFixed(0)];
}

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

export const _getMintSignature = async (account: string, mintCount: number) => {
  const privateKey = PLATFORM_SIGNER_PRIVATE_KEY;
  const wallet = new Wallet(privateKey);
  const message = v4();

  const mintSignature = await wallet.signMessage(
    arrayify(
      solidityKeccak256(
        ["address", "string", "uint256"],
        [account, message, mintCount]
      )
    )
  );
  return { message, signature: mintSignature };
};

export const getMintSignature = async ({
  account,
  mintCount,
  chainId,
  projectId,
  signature,
}: {
  account: string;
  mintCount: number;
  chainId: number;
  projectId: number;
  signature?: string;
}) => {
  if (!isAddress(account)) throw "Invalid Wallet Address : mint signature";
  const currentSale = await getCurrentSale(projectId).catch(() => null);
  if (!currentSale) throw "Current Sale Not Found";

  if (
    currentSale.tokenGatedAddress !== ethers.constants.AddressZero &&
    currentSale.mintCharge === 0 &&
    (await is721(currentSale.tokenGatedAddress, chainId))
  ) {
    if (!signature) throw "Signature not provided";
    const recoveredAddress = recoverAddress(
      hashMessage(getMessageToSignOnTokenGatedMint(account, mintCount)),
      signature
    );
    if (recoveredAddress !== account) throw "Invalid Signature";
    const project = await getProjectById(projectId);
    if (!project.address || !project.chainId)
      throw "Invalid Project Address or ChainId";
    const contract = Collection721__factory.connect(
      project.address,
      new ethers.providers.StaticJsonRpcProvider(RPC_URLS[chainId])
    );

    const [alreadyMinted, tokenGatedMintCount] = await Promise.all([
      contract
        .mintCountByIdentifierWallet(currentSale.saleIdentifier, account)
        .then((res) => res.toNumber())
        .catch(() => null),
      prisma.tokenGatedTransferEvents
        .count({
          where: {
            address: currentSale.tokenGatedAddress,
            chainId,
            from: ethers.constants.AddressZero,
            to: account,
          },
        })
        .catch(() => null),
    ]);

    if (alreadyMinted === null) throw "Error getting already minted count";
    if (tokenGatedMintCount === null)
      throw "Error getting token gated mint count";

    console.log({
      alreadyMinted,
      tokenGatedMintCount,
      limit: getTokenGatedLimit(tokenGatedMintCount),
      signature,
    });

    if (alreadyMinted + mintCount > getTokenGatedLimit(tokenGatedMintCount))
      throw "DFTSW Formula : Mint Limit Exceeds";
  }
  const privateKey = PLATFORM_SIGNER_PRIVATE_KEY;
  const wallet = new Wallet(privateKey);
  const message = v4();

  const mintSignature = await wallet.signMessage(
    arrayify(
      solidityKeccak256(
        ["address", "string", "uint256"],
        [account, message, mintCount]
      )
    )
  );
  return { message, signature: mintSignature };
};
