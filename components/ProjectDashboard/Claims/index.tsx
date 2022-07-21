import { SaleConfig } from "@prisma/client";
import { useEthers } from "@usedapp/core";
import { Contract } from "ethers";
import { isAddress } from "ethers/lib/utils";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { v4 } from "uuid";
import { ABI1155, ABI721 } from "../../../constants/abis";
import { service } from "../../../service";
import { ISaleConfigInput } from "../../../types";
import ClaimItem from "./ClaimItem";
import SaleConfigItem from "./SaleConfigItem";

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
  const [saleConfigs, setSaleConfigs] = useState<
    Omit<SaleConfig, "id" | "projectId">[]
  >([]);
  const [bgProcess, setBgProcess] = useState(0);
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
  }, [projectId]);
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

    const rootPayload: ISaleConfigInput[] = saleConfigs.map((sc) => ({
      enabled: sc.enabled,
      startTime: sc.startTime,
      endTime: sc.endTime,
      maxMintInSale: sc.maxMintInSale,
      maxMintPerWallet: sc.maxMintPerWallet,
      mintCharge: sc.mintCharge,
      whitelistAddresses: sc.whitelist.includes(account)
        ? sc.whitelist
        : [...sc.whitelist, account],
      saleType: sc.saleType as "private" | "public",
      uuid: sc.saleIdentifier,
    }));

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

    const contract = new Contract(
      projectAddress,
      collectionType === "721" ? ABI721 : ABI1155,
      library.getSigner(account)
    );

    const updateSaleConfigRootTx = await toast.promise(
      contract.updateSaleConfigRoot(saleConfigRoot.data),
      {
        error: "Error sending transaction",
        loading: "Sending transaction",
        success: "Transaction sent successfully",
      }
    );

    const [{ data: response }] = await toast.promise(
      Promise.all([
        service.put(`sale-config/${projectId}`, {
          saleConfigs: saleConfigs.map((sc) => ({
            ...sc,
            id: undefined,
            projectId: undefined,
          })),
        }),
        (updateSaleConfigRootTx as any).wait(),
      ]),
      {
        error: "Error completing transaction",
        loading: "Mining transaction...",
        success: "Transaction Completed",
      }
    );
    console.log(response);
  };
  return (
    <div>
      <button onClick={() => console.log(saleConfigs)}>log</button>
      <button
        onClick={() =>
          setSaleConfigs((prev) => [
            ...prev,
            {
              enabled: true,
              startTime: 0,
              endTime: 0,
              maxMintInSale: 0,
              maxMintPerWallet: 0,
              mintCharge: 0,
              saleIdentifier: v4(),
              saleType: "private",
              whitelist: [],
            },
          ])
        }
      >
        Add Sale Wave
      </button>
      <button onClick={handleUpdateClick}>Update</button>
      {saleConfigs.map((sc, index) => (
        <SaleConfigItem
          index={index}
          key={sc.saleIdentifier}
          saleWaveConfig={sc}
          setSaleConfigs={setSaleConfigs}
        />
      ))}
    </div>
  );
};

export default ClaimsSection;
