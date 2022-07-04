import Image from "next/image";
import React from "react";
import { NftExtended } from "../../types";

const OverviewSection = ({ nfts }: { nfts: NftExtended[] }) => {
  return (
    <div>
      <div className="flex justify-start w-full gap-4 p-4 overflow-x-auto">
        <div className="bg-gray-300 rounded p-3 w-full min-w-[180px]">
          <h1>Total Supply</h1>
          <h2>{nfts.length}</h2>
        </div>
        <div className="bg-gray-300 rounded p-3 w-full min-w-[180px]">
          <h1>Claimed Supply</h1>
          <h2>{nfts.filter((nft) => !!nft.tokenId).length}</h2>
        </div>
        <div className="bg-gray-300 rounded p-3 w-full min-w-[180px]">
          <h1>Unclaimed Supply</h1>
          <h2>{nfts.filter((nft) => !!!nft.tokenId).length}</h2>
        </div>
      </div>
      <div className="overflow-y-auto">
        <table className="w-full">
          <thead>
            <tr>
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
            {nfts.map((nft) => (
              <tr key={nft.id}>
                <td className="p-4 text-center min-w-[100px]">{nft.tokenId}</td>
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
                  {!!nft.tokenId ? "0xabc" : "0x000"}
                </td>
                <td className="p-4 text-center min-w-[100px]">
                  {!nft.tokenId && <button>Delete</button>}
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
