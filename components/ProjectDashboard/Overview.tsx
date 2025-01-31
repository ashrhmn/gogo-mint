import { Contract, ethers, providers } from "ethers";
import { isAddress } from "ethers/lib/utils";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
import toast, { LoaderIcon } from "react-hot-toast";
import dynamic from "next/dynamic";
const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });
import { ABI1155, ABI721 } from "../../constants/abis";
import { RPC_URLS } from "../../constants/RPC_URL";
import { service } from "../../service";

import { resolveIPFS } from "../../utils/Request.utils";
import { getUrlFileExtension } from "../../utils/String.utils";
import CopyAddressToClipboard from "../Common/CopyAddressToClipboard";
import { NFT } from "@prisma/client";

const OverviewSection = ({
  nfts,
  address,
  projectChainId,
  collectionType,
  nftCount: allNftCount,
  claimedSupply,
  unclaimedSupply,
  page,
  view,
  filterStatus,
}: {
  nfts: NFT[];
  address: string | null;
  projectChainId: number | null;
  collectionType: string | null;
  nftCount: number;
  claimedSupply: number;
  unclaimedSupply: number;
  page: number;
  view: number;
  filterStatus: "all" | "minted" | "unminted";
}) => {
  const nftCount =
    filterStatus === "all"
      ? allNftCount
      : filterStatus === "minted"
      ? claimedSupply
      : unclaimedSupply;
  // const { account, library } = useEthers();
  const router = useRouter();
  const [nftsWithOwner, setNftsWithOwner] =
    useState<(NFT & { owner?: string })[]>(nfts);
  const [bgProcRunning, setBgProcRunning] = useState(0);
  useEffect(() => {
    if (
      !!address &&
      !!projectChainId &&
      isAddress(address) &&
      !!RPC_URLS[projectChainId]
    ) {
      if (collectionType === "1155") return;
      const contract = new Contract(
        address,
        collectionType === "721" ? ABI721 : ABI1155,
        new providers.StaticJsonRpcProvider(RPC_URLS[projectChainId])
      );
      nfts.forEach(async (nft) => {
        if (nft.tokenId === null) return;
        setBgProcRunning((v) => v + 1);
        try {
          const owner = await contract
            .ownerOf(nft.tokenId)
            .catch(() => ethers.constants.AddressZero);
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

  const handleDeleteNft = async (id: number) => {
    await toast.promise(
      service
        .delete(`nft/${id}`)
        .then((res) => res.data)
        // .then(console.log)
        .then(() => {
          router.reload();
        }),
      {
        error: "Error deleting NFT",
        loading: "Deleting NFT",
        success: "Deleted",
      }
    );
  };

  return (
    <div>
      {collectionType === "721" && (
        <div className="flex justify-start w-full gap-4 p-4 overflow-x-auto">
          <div className="bg-gray-800 rounded p-3 w-full min-w-[180px]">
            <h1>Total Supply</h1>
            <h2>{allNftCount}</h2>
          </div>
          <div className="bg-gray-800 rounded p-3 w-full min-w-[180px]">
            <h1>Claimed Supply</h1>
            <h2>{claimedSupply}</h2>
          </div>
          <div className="bg-gray-800 rounded p-3 w-full min-w-[180px]">
            <h1>Unclaimed Supply</h1>
            <h2>{unclaimedSupply}</h2>
          </div>
        </div>
      )}
      {collectionType === "721" && (
        <div className="flex flex-wrap items-center justify-center sm:justify-end my-3 gap-4">
          {/* <select
            className="bg-gray-800 rounded p-2"
            value={filterStatus}
            onChange={(e) => {
              router
                .push({
                  ...router,
                  query: { ...router.query, status: e.target.value, page: 1 },
                })
                .then(() => router.reload());
            }}
          >
            {["All", "Minted", "Unminted"].map((v) => (
              <option key={v} value={v.toLowerCase()}>
                {v}
              </option>
            ))}
          </select> */}
          <div className="flex gap-2">
            <button
              disabled={page === 1 || Math.ceil(nftCount / view) === 0}
              onClick={async () => {
                if (page === 1) return;
                await router.push({
                  ...router,
                  query: { ...router.query, page: page - 1 },
                });
                router.reload();
              }}
              className="hover:bg-gray-700 rounded transition-colors p-1 disabled:cursor-not-allowed border-2 border-gray-600"
            >
              Prev
            </button>
            <div className="bg-gray-800 py-1 px-3 rounded">
              Page{" "}
              <select
                className="rounded p-1 bg-gray-700"
                value={page}
                onChange={async (e) => {
                  await router.push({
                    ...router,
                    query: { ...router.query, page: e.target.value },
                  });
                  router.reload();
                }}
              >
                {Array(Math.ceil(nftCount / view))
                  .fill(0)
                  .map((_, i) => (
                    <option key={i} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
              </select>{" "}
              of {Math.ceil(nftCount / view)}
            </div>
            <button
              disabled={
                page === Math.ceil(nftCount / view) ||
                Math.ceil(nftCount / view) === 0
              }
              onClick={async () => {
                if (page === Math.ceil(nftCount / view)) return;
                await router.push({
                  ...router,
                  query: { ...router.query, page: page + 1 },
                });
                router.reload();
              }}
              className="hover:bg-gray-800 rounded transition-colors p-1 disabled:cursor-not-allowed border-2 border-gray-600"
            >
              Next
            </button>
          </div>
          <div className="bg-gray-800 py-1 px-3 rounded">
            View Per Page{" "}
            <select
              className="rounded p-1 bg-gray-700"
              value={view}
              onChange={async (e) => {
                await router.push({
                  ...router,
                  query: { ...router.query, view: e.target.value, page: 1 },
                });
                router.reload();
              }}
            >
              {Array(10)
                .fill(0)
                .map((_, i) => (
                  <option key={i} value={(i + 1) * 10}>
                    {(i + 1) * 10}
                  </option>
                ))}
            </select>
          </div>
        </div>
      )}
      <div className="overflow-y-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-t-2 border-gray-600 bg-gray-800">
              {/* <th>ID</th> */}
              {collectionType === "721" && <th>Token ID</th>}
              <th>Media</th>
              <th>Name</th>
              <th>Description</th>
              <th>Properties</th>
              {collectionType === "721" && <th>Owner</th>}
              {collectionType === "721" && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {nftsWithOwner
              .sort((a, b) => (a.tokenId || 0) - (b.tokenId || 0))
              .map((nft) => (
                <tr className="border-b-2 border-gray-500" key={nft.id}>
                  {/* <td className="p-4 text-center min-w-[100px]">{nft.id}</td> */}
                  {collectionType === "721" && (
                    <td className="p-4 text-center min-w-[100px]">
                      {nft.tokenId}
                    </td>
                  )}
                  <td className="p-4 text-center min-w-[100px]">
                    {nft.imageUrl && (
                      <div className="h-20 w-20 relative">
                        {["mp4", "avi", "mkv", "wmv"].includes(
                          getUrlFileExtension(nft.imageUrl).toLowerCase()
                        ) ? (
                          <ReactPlayer
                            height="100%"
                            width="100%"
                            muted
                            playing
                            loop
                            url={nft.imageUrl}
                            style={{ position: "absolute", inset: "0" }}
                          />
                        ) : (
                          <Image
                            src={resolveIPFS(nft.imageUrl)}
                            alt=""
                            layout="fill"
                            objectFit="cover"
                            priority
                          />
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-center min-w-[100px]">{nft.name}</td>
                  <td className="p-4 text-center min-w-[100px]">
                    {nft.description}
                  </td>
                  <td className="p-4 min-w-[100px]">
                    <TraitPropertiesView propStr={nft.properties} />
                  </td>
                  {collectionType === "721" && (
                    <td className="p-4 text-center min-w-[100px]">
                      {!!bgProcRunning ? (
                        <LoaderIcon />
                      ) : !!nft.owner ? (
                        <CopyAddressToClipboard address={nft.owner} shorten />
                      ) : (
                        "0x0000.....0000"
                      )}
                    </td>
                  )}
                  {collectionType === "721" && (
                    <td className="p-4 text-center min-w-[100px]">
                      <div
                        className="cursor-pointer"
                        onClick={() => handleDeleteNft(nft.id)}
                      >
                        {nft.owner === ethers.constants.AddressZero && (
                          <button className="bg-red-500 text-white p-1 rounded w-28 hover:bg-red-700 transition-colors">
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TraitPropertiesView = ({ propStr }: { propStr?: string }) => {
  const properties = useMemo(() => {
    try {
      return JSON.parse(propStr || "[]") as { type: string; value: string }[];
    } catch (error) {
      return [];
    }
  }, [propStr]);

  return (
    <pre className="bg-gray-700 p-2 rounded">
      {JSON.stringify(
        properties.map((p) => ({ trait_type: p.type, value: p.value })),
        null,
        2
      )}
    </pre>
  );
};

export default OverviewSection;
