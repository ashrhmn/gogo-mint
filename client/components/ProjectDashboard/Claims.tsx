import React from "react";
import ClaimItem from "./Claims/ClaimItem";

const ClaimsSection = ({
  collectionType,
  projectAddress,
  projectChainId,
  projectId,
}: {
  projectId: number;
  projectChainId: number | null;
  projectAddress: string | null;
  collectionType: string | null;
}) => {
  return (
    <div>
      <ClaimItem
        heading="Private Sale 1"
        getFunction="privateSale1"
        updateFunction="updatePrivateSale1"
        collectionType={collectionType}
        projectAddress={projectAddress}
        projectChainId={projectChainId}
      />
      <ClaimItem
        heading="Private Sale 2"
        getFunction="privateSale2"
        updateFunction="updatePrivateSale2"
        collectionType={collectionType}
        projectAddress={projectAddress}
        projectChainId={projectChainId}
      />
      <ClaimItem
        heading="Public Sale"
        getFunction="publicSale"
        updateFunction="updatePublicSale"
        collectionType={collectionType}
        projectAddress={projectAddress}
        projectChainId={projectChainId}
      />
    </div>
  );
};

export default ClaimsSection;
