import React, { useEffect, useRef, useState } from "react";
import { parse as parseCsv } from "papaparse";
import toast from "react-hot-toast";
import { z } from "zod";
import { NFT } from "@prisma/client";
import { service } from "../../service";
import Image from "next/image";
import { resolveIPFS } from "../../utils/Request.utils";
import Link from "next/link";
import { useRouter } from "next/router";

type INFTCreateType = Omit<NFT, "id" | "tokenId"> & {
  properties: { trait_type: string | null; value: string }[];
};

const BatchCreateModal = ({
  isBatchCreateModalOpen,
  setIsBatchCreateModalOpen,
  projectId,
}: {
  projectId: number;
  ownerAddress: string | null;
  setIsBatchCreateModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isBatchCreateModalOpen: boolean;
}) => {
  const [parseBgProc, setParseBgProc] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [nftsAdded, setNftsAdded] = useState<INFTCreateType[]>([]);
  const router = useRouter();

  const handleSaveBtn = async () => {
    try {
      const nfts: {
        signature: string | null;
        message: string | null;
        tokenId: number | null;
        name: string;
        description: string | null;
        properties: { type: string | null; value: string }[];
        backgroundColor: string | null;
        externalUrl: string | null;
        imageUrl: string | null;
      }[] = nftsAdded.map((nft) => ({
        signature: nft.signature,
        backgroundColor: nft.backgroundColor,
        description: nft.description,
        externalUrl: nft.externalUrl,
        imageUrl: nft.imageUrl,
        message: nft.message,
        name: nft.name,
        tokenId: null,
        properties: nft.properties.map((p) => ({
          type: p.trait_type,
          value: p.value,
        })),
      }));

      const { data: response } = await toast.promise(
        service.post(`nft/batch`, {
          nfts,
          projectId,
        }),
        {
          error: "Error adding NFTs",
          loading: "Saving NFTs",
          success:
            nftsAdded.length < 10
              ? "Added NFTs successfully"
              : "NFTs added to queue, will appear on dashboard in a moment",
        }
      );
      console.log(response);
      router.reload();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div
      className={`fixed inset-0 sm:left-auto shadow-xl bg-white transition-transform duration-300 p-6 overflow-y-auto sm:min-w-[500px] ${
        isBatchCreateModalOpen ? "z-50" : "translate-x-full"
      }`}
    >
      <div
        className="absolute right-4 top-4 cursor-pointer"
        onClick={() => setIsBatchCreateModalOpen(false)}
      >
        <CloseIcon className="h-8 w-8" />
      </div>

      <h1 className="text-2xl font-bold">Batch Add NFTs</h1>
      <p className="mt-4 text-lg">
        See{" "}
        <Link href={`/example/nft/example.json`} passHref>
          <a className="text-sky-500 font-medium hover:text-sky-600 transition-colors">
            example.json
          </a>
        </Link>{" "}
        or{" "}
        <Link href={`/example/nft/example.csv`} passHref>
          <a className="text-sky-500 font-medium hover:text-sky-600 transition-colors">
            example.csv
          </a>
        </Link>{" "}
        for reference
      </p>
      <input
        onChange={(e) => {
          if (!e.target.files) return;
          const file = e.target.files[0];
          const extension = file.name
            .split(".")
            [file.name.split(".").length - 1].toLowerCase();
          if (extension === "json") {
            setParseBgProc((v) => v + 1);
            const reader = new FileReader();
            reader.onload = async (event) => {
              try {
                if (
                  !event.target?.result ||
                  typeof event.target.result !== "string"
                )
                  throw "Error reading JSON file";
                const nftsJson = JSON.parse(event.target?.result);
                const nfts = z
                  .object({
                    name: z.string().min(1),
                    description: z.string().optional(),
                    external_url: z.string().optional(),
                    background_color: z.string().optional(),
                    image_url: z.string().optional(),
                    properties: z
                      .object({
                        trait_type: z.string().optional(),
                        value: z.string(),
                      })
                      .array(),
                  })
                  .array()
                  .parse(nftsJson);
                const { data: messageSignaturesResponse } = await service.get(
                  `platform-signer/random-sign/${nfts.length}`
                );

                const messageSignatures = z
                  .object({ message: z.string(), signature: z.string() })
                  .array()
                  .length(nfts.length)
                  .parse(messageSignaturesResponse.data);

                setNftsAdded((prev) => [
                  ...prev,
                  ...nfts.map((nft, index) => ({
                    name: nft.name,
                    backgroundColor: nft.background_color || null,
                    description: nft.description || null,
                    externalUrl: nft.external_url || null,
                    imageUrl: nft.image_url || null,
                    projectId: projectId,
                    message: messageSignatures[index].message,
                    signature: messageSignatures[index].signature,
                    properties: nft.properties.map((p) => ({
                      trait_type: p.trait_type || null,
                      value: p.value,
                    })),
                  })),
                ]);
                setParseBgProc((v) => v - 1);
              } catch (error) {
                setParseBgProc((v) => v - 1);
                console.log("Error parsing json : ", error);
                toast.error("Error parsing JSON");
                if (typeof error === "string") toast.error(error);
              }
            };
            reader.readAsText(file);
          } else if (extension === "csv") {
            setParseBgProc((v) => v + 1);
            parseCsv(file, {
              header: true,
              complete: async (results) => {
                try {
                  z.string()
                    .array()
                    .parse(results.data.map((d: any) => d.name));

                  const { data: messageSignaturesResponse } = await service.get(
                    `platform-signer/random-sign/${results.data.length}`
                  );
                  const messageSignatures = z
                    .object({ message: z.string(), signature: z.string() })
                    .array()
                    .length(results.data.length)
                    .parse(messageSignaturesResponse.data);

                  setNftsAdded((prev) => [
                    ...prev,
                    ...results.data.map((r: any, index) => ({
                      name: r.name,
                      description: r.description || null,
                      backgroundColor: r.background_color || null,
                      externalUrl: r.external_url || null,
                      imageUrl: r.image || null,
                      message: messageSignatures[index].message,
                      projectId,
                      signature: messageSignatures[index].signature,
                      properties: Object.keys(r)
                        .filter(
                          (key) =>
                            ![
                              "name",
                              "description",
                              "external_url",
                              "background_color",
                              "image",
                            ].includes(key)
                        )
                        .map((key) => ({
                          trait_type: key,
                          value: r[key],
                        })),
                    })),
                  ]);
                  setParseBgProc((v) => v - 1);
                } catch (error) {
                  setParseBgProc((v) => v - 1);
                  console.log(error);
                  toast.error("Error loading csv data");
                }
              },
            });
          } else {
            toast.error("Invalid file format");
          }
          e.target.value = "";
        }}
        hidden
        ref={fileInputRef}
        type="file"
      />
      <div
        onClick={() =>
          parseBgProc === 0 &&
          fileInputRef.current &&
          fileInputRef.current.click()
        }
        className="h-28 bg-gray-500 rounded text-white m-4 flex justify-center items-center text-3xl cursor-pointer select-none font-bold"
      >
        {parseBgProc > 0 ? "Parsing..." : "Select CSV or JSON"}
      </div>
      <div className="flex justify-end items-center gap-4">
        <button
          disabled={nftsAdded.length === 0}
          onClick={() => setNftsAdded([])}
          className="bg-red-500 text-white rounded p-2 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors"
        >
          Reset
        </button>
        <button
          disabled={nftsAdded.length === 0}
          onClick={handleSaveBtn}
          className="bg-teal-500 text-white rounded p-2 hover:bg-teal-700 disabled:bg-teal-300 disabled:cursor-not-allowed transition-colors"
        >
          Save
        </button>
      </div>
      <h1 className="text-center text-xl font-semibold">
        {nftsAdded.length === 0 && "No NFTs added, try adding some"}
        {nftsAdded.length > 0 && `${nftsAdded.length} NFT(s) added`}
      </h1>
      <div className="max-h-96 overflow-y-auto my-6 bg-gray-200 rounded-xl">
        {nftsAdded.map((nft) => (
          <div
            className="flex gap-4 mx-2 my-6 bg-gray-100 p-2 rounded-xl pt-8 relative"
            key={nft.message}
          >
            <div
              className="absolute top-2 right-2 cursor-pointer hover:bg-gray-200 rounded"
              onClick={() =>
                setNftsAdded((prev) =>
                  prev.filter((prevNft) => prevNft.message !== nft.message)
                )
              }
            >
              <CloseIcon className="w-4 h-4" />
            </div>
            <div className="w-2/3 p-1 divide-y-2">
              <div className="flex justify-between">
                <span>Name : </span>
                <span className="max-w-[50%]">{nft.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Description : </span>
                <span className="max-w-[50%]">{nft.description}</span>
              </div>
              <div className="flex justify-between">
                <span>External URL : </span>
                <span className="max-w-[50%]">{nft.externalUrl}</span>
              </div>
              <div className="flex justify-between">
                <span>Background Color : </span>
                <span className="max-w-[50%]">{nft.backgroundColor}</span>
              </div>
            </div>
            {!!nft.imageUrl && (
              <div className="relative aspect-square w-1/3">
                <Image layout="fill" src={resolveIPFS(nft.imageUrl)} alt="" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const CloseIcon = ({ className }: { className: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
);

export default BatchCreateModal;
