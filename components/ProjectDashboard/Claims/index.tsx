import { SaleConfig } from "@prisma/client";
import React, { useEffect, useState } from "react";
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
  const [saleConfigs, setSaleConfigs] = useState<SaleConfig[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const { data: response } = await service.get(
          `sale-config/${projectId}`
        );
        setSaleConfigs(response.data);
        console.log(response);
      } catch (error) {
        console.log(error);
      }
    })();
  }, [projectId]);
  return (
    <div>
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
