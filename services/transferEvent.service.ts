import { prisma } from "../lib/db";
import { RPC_URLS } from "../constants/RPC_URL";
import { ethers } from "ethers";
import { Collection721__factory } from "../ContractFactory";
import { isAddress } from "ethers/lib/utils";
import { getParsedEthersError } from "@enzoferey/ethers-error-parser";

export const fetchAndStoreEvents = async (
  projectId: number,
  tokenGatedAddress: string,
  overrides?: { startFromZero?: boolean; waitToComplete?: boolean }
) => {
  console.log("fetch", projectId, tokenGatedAddress);

  const project = await prisma.project.findFirst({ where: { id: projectId } });
  if (!project) throw "Project Not Found";
  if (!project.chainId) throw "Invalid ChainID";
  if (!isAddress(tokenGatedAddress)) throw "Invalid Address";
  const rpcUrl = RPC_URLS[project.chainId || 0];
  if (!rpcUrl) throw "Unsupported network";

  const existingSale = await prisma.saleConfig.findFirst({
    where: { projectId, tokenGatedAddress },
  });

  if (!existingSale) throw "Token Gated Address is not a part of any sale wave";

  const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrl);

  const startBlock =
    !!overrides && overrides.startFromZero
      ? 0
      : await prisma.tokenGatedTransferEvents
          .aggregate({
            _max: { blockNumber: true },
          })
          .then((res) => (res._max.blockNumber ? res._max.blockNumber + 1 : 0));

  const endBlock = await provider.getBlockNumber();

  console.log({ startBlock, endBlock });

  const task = async () =>
    await _fetchAndStoreEvents({
      address: tokenGatedAddress,
      endBlock,
      projectId,
      rpcUrl,
      startBlock,
      chainId: project.chainId!,
    });

  !!overrides && overrides.waitToComplete ? await task() : task();
};

const _fetchAndStoreEvents = async ({
  address,
  rpcUrl,
  endBlock,
  projectId,
  startBlock,
  chainId,
}: {
  address: string;
  rpcUrl: string;
  startBlock: number;
  endBlock: number;
  projectId: number;
  chainId: number;
}) => {
  try {
    const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrl);
    const contract = Collection721__factory.connect(address, provider);
    const eventFilter = contract.filters["Transfer(address,address,uint256)"]();
    const events = await contract.queryFilter(
      eventFilter,
      startBlock,
      endBlock
    );
    console.log("Success : ", events.length);

    await prisma.tokenGatedTransferEvents.createMany({
      data: events
        .filter((e) => e.args[0] === ethers.constants.AddressZero)
        .map(
          ({
            blockHash,
            blockNumber,
            transactionHash,
            transactionIndex,
            logIndex,
            args,
          }) => ({
            blockHash,
            blockNumber,
            from: args[0],
            logIndex,
            to: args[1],
            tokenId: args[2].toString(),
            transactionHash,
            transactionIndex,
            address,
            chainId,
          })
        ),
      skipDuplicates: true,
    });
  } catch (error) {
    if (
      ["SERVER_ERROR", "query returned more than 10000 results"]
        .map((v) => v.toLowerCase())
        .includes(
          getParsedEthersError(error as any).context?.toLowerCase() || ""
        )
    ) {
      console.log("Splitting...");
      const middle = Math.round((startBlock + endBlock) / 2);
      await Promise.all([
        _fetchAndStoreEvents({
          address,
          projectId,
          rpcUrl,
          startBlock,
          endBlock: middle,
          chainId,
        }),
        _fetchAndStoreEvents({
          address,
          projectId,
          rpcUrl,
          startBlock: middle + 1,
          endBlock,
          chainId,
        }),
      ]);
    } else {
      console.log({
        message: getParsedEthersError(error as any).context,
        error,
      });
      console.log("Retrying...");
      await _fetchAndStoreEvents({
        address,
        endBlock,
        projectId,
        rpcUrl,
        startBlock,
        chainId,
      });
    }
  }
};
