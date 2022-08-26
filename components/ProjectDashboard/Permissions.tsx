import { useEthers } from "@usedapp/core";
import { Contract, providers } from "ethers";
import { isAddress } from "ethers/lib/utils";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ABI721 } from "../../constants/abis";
import { RPC_URLS } from "../../constants/RPC_URL";
import { service } from "../../service";

const PermissionsSection = ({
  projectAddress,
  projectChainId,
}: {
  projectAddress: string | null;
  projectChainId: number | null;
}) => {
  const { account, library } = useEthers();
  const [projectContract, setProjectContract] = useState<Contract | null>();
  const [currentOwner, setCurrentOwner] = useState("");
  const [toBeOwner, setToBeOwner] = useState("");
  useEffect(() => {
    if (projectAddress && projectChainId && library && account) {
      setProjectContract(
        new Contract(projectAddress, ABI721, library.getSigner(account))
      );
    } else {
      setProjectContract(null);
    }
    if (projectAddress && projectChainId && RPC_URLS[projectChainId]) {
      (async () => {
        try {
          const contract = new Contract(
            projectAddress,
            ABI721,
            new providers.StaticJsonRpcProvider(RPC_URLS[projectChainId])
          );
          const owner = await contract.owner();
          setCurrentOwner(owner);
          // console.log("Owner : ", owner);
        } catch (error) {
          console.log(error);
        }
      })();
    }
  }, [account, library, projectAddress, projectChainId]);
  const onUpdateClick = async () => {
    if (!isAddress(toBeOwner)) {
      toast.error("Invalid owner address");
      return;
    }
    if (!library || !account) {
      toast.error("Please connect your wallet");
      return;
    }
    if (currentOwner !== account) {
      toast.error("You must be the owner to update contract owner");
    }
    if (!projectContract) {
      toast.error("Error connecting contract");
      return;
    }
    try {
      const tx = await toast.promise(
        projectContract.transferOwnership(toBeOwner),
        {
          error: "Error sending transaction",
          loading: "Sending transaction...",
          success: "Transaction sent successfully",
        }
      );
      console.log("Tx : ", tx);

      const txR = await toast.promise((tx as any).wait(), {
        success: "Mined successfully",
        loading: "Mining...",
        error: "Error mining transaction",
      });
      console.log("TxR : ", txR);
      const project = await toast.promise(
        service.put(`/projects/owner`, {
          projectAddress,
          projectChainId,
          ownerAddress: toBeOwner,
        }),
        {
          error: "Error updating data",
          loading: "Updating data...",
          success: "Updated data",
        }
      );
      console.log("Project : ", project);
    } catch (error) {
      console.log("Error updating owner : ", error);
      if (typeof error === "string") toast.error(error);
    }
  };
  return (
    <div className="text-2xl">
      <div className="bg-gray-200 rounded w-full m-3 p-4">
        <h2 className="font-medium">Current Owner : {currentOwner}</h2>
      </div>
      <div className="bg-gray-200 rounded w-full m-3 p-4">
        <h1 className="my-2 font-medium">Update Ownership</h1>
        <div className="flex gap-4">
          <input
            className="w-full rounded bg-gray-100 h-14 p-3 focus:bg-white transition-colors"
            type="text"
            value={toBeOwner}
            onChange={(e) => setToBeOwner(e.target.value)}
          />
          <button
            className="bg-indigo-600 text-white w-32 rounded-xl hover:bg-blue-800 transition-colors cursor-pointer disabled:text-gray-400 disabled:bg-indigo-300 disabled:cursor-not-allowed"
            onClick={onUpdateClick}
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionsSection;
