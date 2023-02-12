import { SaleConfig } from "@prisma/client";
import { useEthers } from "@usedapp/core";
import { ethers } from "ethers";
import { isAddress } from "ethers/lib/utils";
import React, { useEffect, useState } from "react";
import toast, { LoaderIcon } from "react-hot-toast";
import { v4 } from "uuid";
import {
  Collection1155__factory,
  Collection721__factory,
} from "../../../ContractFactory";
import { service } from "../../../service";
import { is721 } from "../../../services/ethereum.service";
import { ISaleConfigInput, IWhiteList } from "../../../types";
import SaleConfigItem from "./SaleConfigItem";
import { RPC_URLS } from "../../../constants/RPC_URL";

const ClaimsSection = ({
  collectionType,
  projectAddress,
  projectChainId,
  projectId,
  projectOwner,
}: {
  projectId: number;
  projectChainId: number | null;
  projectAddress: string | null;
  collectionType: string | null;
  projectOwner: string | null;
}) => {
  const { account, library, chainId } = useEthers();
  const [configHistory, setConfigHistory] = useState({
    contract: "",
    db: "",
    editor: "",
  });
  const [saleConfigs, setSaleConfigs] = useState<
    (Omit<SaleConfig, "id" | "projectId"> & {
      invalid?: boolean;
      whitelist: IWhiteList[];
    })[]
  >([]);
  const [bgProcess, setBgProcess] = useState(0);
  const [refetcher, setRefetcher] = useState(false);

  useEffect(() => {
    console.log(JSON.stringify(configHistory, null, 2));
  }, [configHistory]);

  useEffect(() => {
    (async () => {
      if (!projectId) return;
      const db = await service
        .get(`sale-config/root/${projectId}`)
        .then((res) => res.data.data);

      setConfigHistory((v) => ({ ...v, db }));
    })();
    (async () => {
      if (!projectAddress || !projectChainId || !RPC_URLS[chainId || 0]) return;
      const provider = new ethers.providers.JsonRpcProvider(
        RPC_URLS[chainId || 0]
      );
      const contract =
        collectionType === "721"
          ? Collection721__factory.connect(projectAddress, provider)
          : Collection1155__factory.connect(projectAddress, provider);

      const saleConfigRoot = await contract
        .state()
        .then((res) => res.saleConfigRoot)
        .catch(() => "");

      setConfigHistory((v) => ({ ...v, contract: saleConfigRoot }));
    })();
  }, [chainId, collectionType, projectAddress, projectChainId, projectId]);

  useEffect(() => {
    (async () => {
      try {
        setBgProcess((v) => v + 1);
        const { data: response } = await service.get(
          `sale-config/${projectId}`
        );
        setSaleConfigs(response.data);
        console.log(response);
        setBgProcess((v) => v - 1);
      } catch (error) {
        console.log(error);
        toast.error("Error fetching claim phases");
        setBgProcess((v) => v - 1);
      }
    })();
  }, [projectId, refetcher]);
  const handleUpdateClick = async () => {
    if (!account || !library || !chainId) {
      toast.error("No wallet connected");
      return;
    }

    if (account !== projectOwner) {
      toast.error("You are not project owner");
      return;
    }

    if (!projectAddress || !projectChainId || !isAddress(projectAddress)) {
      toast.error("Error loading projet contract");
      return;
    }

    if (chainId !== projectChainId) {
      toast.error(
        `Error network, please switch to network id : ${projectChainId}`
      );
      return;
    }

    try {
      const rootPayload: ISaleConfigInput[] = await Promise.all(
        saleConfigs.map(async (sc) => ({
          enabled: sc.enabled,
          startTime: sc.startTime,
          endTime: sc.endTime,
          maxMintInSale: sc.maxMintInSale,
          maxMintPerWallet:
            isAddress(sc.tokenGatedAddress) &&
            (await is721(sc.tokenGatedAddress, chainId))
              ? 0
              : sc.maxMintPerWallet,
          mintCharge: sc.mintCharge,
          whitelistAddresses: sc.whitelist,
          saleType:
            isAddress(sc.tokenGatedAddress) &&
            (await is721(sc.tokenGatedAddress, chainId))
              ? "private"
              : (sc.saleType as "private" | "public"),
          uuid: sc.saleIdentifier,
          tokenGatedAddress:
            isAddress(sc.tokenGatedAddress) &&
            (await is721(sc.tokenGatedAddress, chainId))
              ? sc.tokenGatedAddress
              : ethers.constants.AddressZero,
        }))
      );

      const { data: saleConfigRoot } = await toast.promise(
        service.post(`/sale-config/root`, {
          saleConfigs: rootPayload,
        }),
        {
          error: "Error generating sale config hash",
          loading: "Generating sale config hash",
          success: "Sale configs hash generated...",
        }
      );

      if (saleConfigRoot.error) {
        toast.error("Error geenerating sale config hash");
        return;
      }
      const dbPayload = await Promise.all(
        saleConfigs.map(async (sc) => ({
          ...sc,
          id: undefined,
          projectId: undefined,
          invalid: undefined,
          whitelist: sc.whitelist,
          tokenGatedAddress:
            isAddress(sc.tokenGatedAddress) &&
            (await is721(sc.tokenGatedAddress, chainId))
              ? sc.tokenGatedAddress
              : ethers.constants.AddressZero,
        }))
      );

      console.log(JSON.stringify(dbPayload, null, 2));

      const contract =
        collectionType === "721"
          ? new Collection721__factory(library.getSigner(account)).attach(
              projectAddress
            )
          : new Collection1155__factory(library.getSigner(account)).attach(
              projectAddress
            );

      const updateSaleConfigRootTx = await toast.promise(
        contract.updateSaleConfigRoot(saleConfigRoot.data),
        {
          error: "Error sending transaction",
          loading: "Sending transaction",
          success: "Transaction sent successfully",
        }
      );

      await toast.promise(
        Promise.all([
          service.put(`sale-config/${projectId}`, {
            saleConfigs: dbPayload,
          }),
          updateSaleConfigRootTx.wait(),
        ]),
        {
          error: "Error completing transaction",
          loading: "Mining transaction...",
          success: "Transaction Completed",
        }
      );
      // console.log(response);
    } catch (error) {
      toast.error("Error saving SaleConfigs");
      console.log(error);
    }
  };
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-end gap-4 m-4 items-center overflow-x-auto">
        {bgProcess > 0 && (
          <div className="scale-150">
            <LoaderIcon />
          </div>
        )}
        <button
          onClick={() => setRefetcher((v) => !v)}
          className="bg-teal-500 text-white rounded p-2 hover:bg-teal-700 transition-colors w-full sm:w-auto"
        >
          Reload Waves
        </button>
        <button
          disabled={bgProcess > 0}
          className="bg-green-500 text-white rounded p-2 hover:bg-green-700 transition-colors min-w-max w-full sm:w-auto"
          onClick={() =>
            setSaleConfigs((prev) => [
              ...prev,
              {
                enabled: true,
                startTime: +(Date.now() / 1000).toFixed(0),
                endTime: 0,
                maxMintInSale: 0,
                maxMintPerWallet: 0,
                mintCharge: 0,
                saleIdentifier: v4(),
                saleType: "private",
                whitelist: [],
                tokenGatedAddress: "",
              },
            ])
          }
        >
          Add New Sale Wave
        </button>
        <button
          disabled={bgProcess > 0}
          className="bg-blue-500 text-white rounded p-2 hover:bg-blue-700 transition-colors w-full sm:w-auto"
          onClick={handleUpdateClick}
        >
          Save Sale Waves
        </button>
      </div>
      <p className="text-sm text-gray-500 text-center">
        Requires Transaction on update
      </p>
      {saleConfigs.map((sc, index) => (
        <SaleConfigItem
          index={index}
          key={sc.saleIdentifier}
          saleWaveConfig={{
            ...sc,
            tokenGatedAddress:
              sc.tokenGatedAddress === ethers.constants.AddressZero
                ? ""
                : sc.tokenGatedAddress,
          }}
          setSaleConfigs={setSaleConfigs}
          collectionType={collectionType as "721" | "1155"}
        />
      ))}
    </div>
  );
};

export default ClaimsSection;
