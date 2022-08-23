import { BigNumber, getDefaultProvider } from "ethers";
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
          getDefaultProvider(RPC_URLS[project.chainId])
        );
        // console.log(
        //   "Adding 721 listener for ",
        //   project.address,
        //   project.chainId
        // );
        // contract.removeAllListeners();
        const count721 = contract.listenerCount("Transfer");

        console.log({ contract: project.address, count721 });
      }
      if (project.collectionType === "1155") {
        const contract = Collection1155__factory.connect(
          project.address,
          getDefaultProvider(RPC_URLS[project.chainId])
        );
        // console.log(
        //   "Adding 1155 listener for ",
        //   project.address,
        //   project.chainId
        // );

        const count1155 = contract.listenerCount("TransferSingle");
        console.log({ contract: project.address, count1155 });

        // contract.removeAllListeners();
      }
    });
    return res.json({ message: "Done" });
  }
);
