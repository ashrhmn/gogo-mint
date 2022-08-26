import { useEthers } from "@usedapp/core";
import { Contract, providers } from "ethers";
import React, { useEffect, useMemo, useRef, useState } from "react";
import toast, { LoaderIcon } from "react-hot-toast";
import { ABI1155, ABI721 } from "../../../constants/abis";
import { RPC_URLS } from "../../../constants/RPC_URL";
import { ISaleConfig } from "../../../types";
import {
  formatHtmlDateTime,
  getSaleConfigFromResponse,
} from "../../../utils/String.utils";

const ClaimItem = ({
  heading,
  collectionType,
  getFunction,
  projectAddress,
  projectChainId,
  updateFunction,
  projectOwner,
}: {
  heading: string;
  getFunction: string;
  updateFunction: string;
  projectChainId: number | null;
  projectAddress: string | null;
  collectionType: string | null;
  projectOwner: string | null;
}) => {
  const { account, library, chainId } = useEthers();
  const [saleConfigBgProc, setSaleConfigBgProc] = useState(0);
  const checkboxRef = useRef<HTMLInputElement | null>(null);
  const [configSet, setConfigSet] = useState<ISaleConfig>({
    endTime: 0,
    startTime: 0,
    status: false,
  });
  const [isNoEndChecked, setIsNoEndChecked] = useState(false);
  useEffect(() => {
    try {
      (async () => {
        if (!projectAddress || !projectChainId || !RPC_URLS[projectChainId])
          return;
        setSaleConfigBgProc((v) => v + 1);
        const contract = new Contract(
          projectAddress,
          collectionType === "721" ? ABI721 : ABI1155,
          new providers.StaticJsonRpcProvider(RPC_URLS[projectChainId])
        );
        const result = await contract.functions[getFunction]();
        // console.log(heading, "Result : ", getSaleConfigFromResponse(result));
        setConfigSet(getSaleConfigFromResponse(result));
        if (getSaleConfigFromResponse(result).endTime === 0)
          setIsNoEndChecked(true);
        setSaleConfigBgProc((v) => v - 1);
      })();
    } catch (error) {
      setSaleConfigBgProc((v) => v - 1);
      console.log("Error fetching sales : ", error);
    }
  }, [collectionType, getFunction, heading, projectAddress, projectChainId]);

  const handleUpdateClick = async () => {
    if (!account || !library || !chainId) {
      toast.error("Please connect your wallet");
      return;
    }
    if (chainId != projectChainId) {
      toast.error(`Please switch to network id ${projectChainId}`);
      return;
    }
    if (
      !projectAddress ||
      !projectChainId ||
      !RPC_URLS[projectChainId] ||
      !projectOwner
    ) {
      toast.error("Error loading project contract");
      return;
    }

    if (projectOwner !== account) {
      toast.error("Only owner can update configs");
      return;
    }

    try {
      setSaleConfigBgProc((v) => v + 1);
      const contract = new Contract(
        projectAddress,
        collectionType === "721" ? ABI721 : ABI1155,
        library.getSigner(account)
      );

      const tx = await toast.promise(
        contract.functions[updateFunction](
          configSet.startTime.toFixed(0),
          isNoEndChecked ? 0 : configSet.endTime.toFixed(0),
          configSet.status
        ),
        {
          error: "Error sending transaction",
          loading: "Sending transaction...",
          success: "Transaction sent",
        }
      );
      await toast.promise((tx as any).wait(), {
        error: "Mining failed",
        loading: "Mining transaction...",
        success: "Transaction Completed",
      });
      setSaleConfigBgProc((v) => v - 1);
    } catch (error) {
      setSaleConfigBgProc((v) => v - 1);
      console.log("Error updating claim phase : ", error);
    }
  };

  return (
    <div className="my-4">
      <div className="bg-gray-200 p-4 rounded relative my-4">
        {!!saleConfigBgProc && (
          <div className="absolute right-5 top-5 z-10 scale-150">
            <LoaderIcon />
          </div>
        )}
        <h1 className="text-2xl font-bold">{heading}</h1>
        <div className="flex flex-col sm:flex-row my-1 gap-2">
          <div className="w-full font-medium">Status</div>
          <div className="w-full bg-gray-100 p-1 rounded">
            <select
              disabled={!!saleConfigBgProc}
              value={configSet.status ? "enabled" : "disabled"}
              onChange={(e) =>
                setConfigSet((c) => ({
                  ...c,
                  status: e.target.value === "enabled",
                }))
              }
              className="border-none bg-transparent p-1 w-full disabled:text-gray-400"
            >
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row my-1 gap-2">
          <div className="w-full flex justify-between items-center font-medium">
            <h1 onClick={() => console.log(configSet, isNoEndChecked)}>
              Start Time
            </h1>
            <div>
              <button
                onClick={() =>
                  setConfigSet((c) => ({ ...c, startTime: Date.now() / 1000 }))
                }
                className="bg-gray-300 p-1 rounded text-blue-400 hover:text-blue-500 transition-colors"
                disabled={!!saleConfigBgProc}
              >
                Today
              </button>
            </div>
          </div>
          <div className="w-full flex bg-gray-100 rounded p-1">
            <input
              className="w-full bg-transparent disabled:text-gray-400"
              type="datetime-local"
              disabled={!!saleConfigBgProc}
              value={formatHtmlDateTime(new Date(configSet.startTime * 1000))}
              onChange={(e) =>
                setConfigSet((c) => ({
                  ...c,
                  startTime: +new Date(e.target.value) / 1000,
                }))
              }
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row my-1 gap-2">
          <div className="w-full flex justify-between items-center font-medium">
            <h1>End Time</h1>
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1 bg-gray-300 p-1 rounded text-blue-400 hover:text-blue-500 transition-colors cursor-pointer select-none">
                <input
                  className="cursor-pointer select-none"
                  ref={checkboxRef}
                  type="checkbox"
                  checked={isNoEndChecked}
                  disabled={!!saleConfigBgProc}
                  onChange={(e) => setIsNoEndChecked(e.target.checked)}
                />
                <label
                  onClick={() => {
                    if (checkboxRef.current) {
                      checkboxRef.current.click();
                    }
                  }}
                  className="cursor-pointer select-none"
                >
                  No End
                </label>
              </div>
              <button
                disabled={isNoEndChecked || !!saleConfigBgProc}
                onClick={() =>
                  setConfigSet((c) => ({ ...c, endTime: Date.now() / 1000 }))
                }
                className="bg-gray-300 p-1 rounded text-blue-400 hover:text-blue-500 transition-colors"
              >
                Today
              </button>
            </div>
          </div>
          <div className="w-full flex bg-gray-100 rounded p-1">
            <input
              className="w-full bg-transparent disabled:text-gray-400"
              type="datetime-local"
              disabled={isNoEndChecked || !!saleConfigBgProc}
              value={formatHtmlDateTime(new Date(configSet.endTime * 1000))}
              onChange={(e) =>
                setConfigSet((c) => ({
                  ...c,
                  endTime: +new Date(e.target.value) / 1000,
                }))
              }
            />
          </div>
        </div>
        <div>
          <button
            disabled={!!saleConfigBgProc}
            className="w-full bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:bg-blue-400 disabled:text-gray-400 disabled:cursor-not-allowed p-2 rounded"
            onClick={handleUpdateClick}
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClaimItem;
