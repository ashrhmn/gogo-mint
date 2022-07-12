import { shortenIfAddress, useEthers } from "@usedapp/core";
import { Contract, getDefaultProvider } from "ethers";
import { arrayify, isAddress, solidityKeccak256 } from "ethers/lib/utils";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import toast, { LoaderIcon } from "react-hot-toast";
import { ABI1155, ABI721 } from "../../constants/abis";
import { RPC_URLS } from "../../constants/RPC_URL";
import { getTokenUri } from "../../constants/tokenUri";
import { service } from "../../service";
import { NftExtended } from "../../types";

const OverviewSection = ({
  nfts,
  address,
  projectChainId,
  collectionType,
  ownerAddress,
}: {
  nfts: NftExtended[];
  address: string | null;
  projectChainId: number | null;
  collectionType: string | null;
  ownerAddress: string | null;
}) => {
  const { account, library } = useEthers();
  const router = useRouter();
  const [nftsWithOwner, setNftsWithOwner] =
    useState<(NftExtended & { owner?: string })[]>(nfts);
  const [bgProcRunning, setBgProcRunning] = useState(0);
  useEffect(() => {
    if (
      !!address &&
      !!projectChainId &&
      isAddress(address) &&
      !!RPC_URLS[projectChainId]
    ) {
      const contract = new Contract(
        address,
        collectionType === "721" ? ABI721 : ABI1155,
        getDefaultProvider(RPC_URLS[projectChainId])
      );
      nfts.forEach(async (nft) => {
        if (nft.tokenId === null) return;
        setBgProcRunning((v) => v + 1);
        try {
          const owner = await contract.ownerOf(nft.tokenId);
          const tokenUri = await contract.tokenURI(nft.tokenId);
          console.log("Token URI ", nft.id, " : ", tokenUri);
          setNftsWithOwner((old) => [
            ...old.filter((o) => o.id !== nft.id),
            { ...nft, owner },
          ]);
          setBgProcRunning((v) => v - 1);
        } catch (error) {
          setBgProcRunning((v) => v - 1);
          console.log(`Error getting nft owner : `, error);
        }
      });
    }
  }, [address, collectionType, nfts, projectChainId]);
  const handleSignClick = async (nftId: number) => {
    if (!account || !library) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (ownerAddress && ownerAddress !== account) {
      toast.error(
        `Project owner is ${shortenIfAddress(
          ownerAddress
        )}, only owner can sign NFT`
      );
      return;
    }
    const signature = await library
      .getSigner(account)
      .signMessage(
        arrayify(solidityKeccak256(["string"], [getTokenUri(nftId)]))
      );
    const result = await toast.promise(
      service.put(`nft/signature`, { id: nftId, signature }),
      {
        error: "Error saving signature",
        loading: "Storing signature...",
        success: "Signature stored successfully",
      }
    );
    if ((result as any).error && typeof (result as any).error == "string")
      toast.error((result as any).error);
    router.reload();
  };
  return (
    <div>
      <div className="flex justify-start w-full gap-4 p-4 overflow-x-auto">
        <div className="bg-gray-300 rounded p-3 w-full min-w-[180px]">
          <h1>Total Supply</h1>
          <h2>{nfts.length}</h2>
        </div>
        <div className="bg-gray-300 rounded p-3 w-full min-w-[180px]">
          <h1>Claimed Supply</h1>
          <h2>{nfts.filter((nft) => nft.tokenId !== null).length}</h2>
        </div>
        <div className="bg-gray-300 rounded p-3 w-full min-w-[180px]">
          <h1>Unclaimed Supply</h1>
          <h2>{nfts.filter((nft) => nft.tokenId === null).length}</h2>
        </div>
      </div>
      <div className="overflow-y-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-t-2 border-gray-600 bg-gray-200">
              <th>Token ID</th>
              <th>Media</th>
              <th>Name</th>
              <th>Description</th>
              <th>Properties</th>
              <th>Owner</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {nftsWithOwner
              .sort((a, b) => (a.id > b.id ? 1 : a.id < b.id ? -1 : 0))
              .map((nft) => (
                <tr className="border-b-2 border-gray-500" key={nft.id}>
                  <td className="p-4 text-center min-w-[100px]">
                    {nft.tokenId}
                  </td>
                  <td className="p-4 text-center min-w-[100px]">
                    {nft.imageUrl && (
                      <div className="h-20 w-20 relative">
                        <Image layout="fill" src={nft.imageUrl} alt="" />
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-center min-w-[100px]">{nft.name}</td>
                  <td className="p-4 text-center min-w-[100px]">
                    {nft.description}
                  </td>
                  <td className="p-4 min-w-[100px]">
                    <pre className="bg-gray-300 p-2 rounded">
                      {JSON.stringify(
                        nft.properties.map((p) => ({
                          trait_type: p.type,
                          value: p.value,
                        })),
                        null,
                        2
                      )}
                    </pre>
                  </td>
                  <td className="p-4 text-center min-w-[100px]">
                    {!!bgProcRunning ? (
                      <LoaderIcon />
                    ) : !!nft.owner ? (
                      shortenIfAddress(nft.owner)
                    ) : (
                      "0x0000.....0000"
                    )}
                  </td>
                  <td className="p-4 text-center min-w-[100px]">
                    <div>
                      {nft.tokenId === null && <button>Delete</button>}
                      {!nft.signature && (
                        <button onClick={() => handleSignClick(nft.id)}>
                          Sign
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OverviewSection;
