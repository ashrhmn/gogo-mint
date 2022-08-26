import { BigNumber, providers } from "ethers";
import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { RPC_URLS } from "../../../../constants/RPC_URL";
import {
  Collection1155__factory,
  Collection721__factory,
} from "../../../../ContractFactory";
import { refreshDiscordRolesOnTransferEvent } from "../../../../services/discord.service";
import { getAllProjects } from "../../../../services/project.service";

export default nextConnect<NextApiRequest, NextApiResponse>().get(
  async (req, res) => {
    const projects = await getAllProjects();
    projects.forEach(async (project) => {
      if (project.address === null || project.chainId === null) return;
      if (project.collectionType === "721") {
        const contract = Collection721__factory.connect(
          project.address,
          new providers.StaticJsonRpcProvider(RPC_URLS[project.chainId])
        );
        console.log(
          "Adding 721 listener for ",
          project.address,
          project.chainId
        );
        contract.removeAllListeners();
        contract.on(
          "Transfer",
          async (from: string, to: string, tokenId: BigNumber) => {
            console.log(
              "Transfer: ",
              { from, to, tokenId: tokenId.toNumber() },
              { contract: project.address, chainId: project.chainId }
            );
            if (project.address === null || project.chainId === null) return;
            await refreshDiscordRolesOnTransferEvent(
              project.address,
              project.chainId,
              "721",
              from,
              to
            );
          }
        );
      }
      if (project.collectionType === "1155") {
        const contract = Collection1155__factory.connect(
          project.address,
          new providers.StaticJsonRpcProvider(RPC_URLS[project.chainId])
        );
        console.log(
          "Adding 1155 listener for ",
          project.address,
          project.chainId
        );

        contract.removeAllListeners();
        contract.on(
          "TransferSingle",
          async (
            operator: string,
            from: string,
            to: string,
            id: BigNumber,
            amount: BigNumber
          ) => {
            console.log(
              "TransferSignle : ",
              {
                operator,
                from,
                to,
                id: id.toNumber(),
                amount: amount.toNumber(),
              },
              { contract: project.address, chainId: project.chainId }
            );
            if (project.address === null || project.chainId === null) return;
            await refreshDiscordRolesOnTransferEvent(
              project.address,
              project.chainId,
              "1155",
              from,
              to
            );
          }
        );
      }
    });
    return res.json({ message: "Done" });
  }
);
