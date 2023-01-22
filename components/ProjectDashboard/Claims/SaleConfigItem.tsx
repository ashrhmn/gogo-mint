import React, { useEffect, useRef, useState } from "react";
import {
  formatHtmlDateTime,
  normalizeString,
} from "../../../utils/String.utils";
import { SaleConfig } from "@prisma/client";
import { parse as parseCsv } from "papaparse";
import { isAddress } from "ethers/lib/utils";
import toast from "react-hot-toast";
import Link from "next/link";
import CopyAddressToClipboard from "../../Common/CopyAddressToClipboard";
import { useEthers } from "@usedapp/core";
import { is721 } from "../../../services/ethereum.service";
import { IWhiteList } from "../../../types";

const SaleConfigItem = ({
  saleWaveConfig,
  setSaleConfigs,
  index,
  collectionType,
}: {
  saleWaveConfig: Omit<SaleConfig, "id" | "projectId"> & {
    invalid?: boolean;
    whitelist: IWhiteList[];
  };
  setSaleConfigs: React.Dispatch<
    React.SetStateAction<
      (Omit<SaleConfig, "id" | "projectId"> & {
        invalid?: boolean;
        whitelist: IWhiteList[];
      })[]
    >
  >;
  index: number;
  collectionType: "721" | "1155";
}) => {
  const [tempWl, setTempWl] = useState({ address: "", limit: 0 });
  const whitelistCsvInputRef = useRef<HTMLInputElement | null>(null);
  const checkboxRef = useRef<HTMLInputElement | null>(null);

  const { chainId } = useEthers();
  const [isTokenGated, setIsTokenGated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setIsTokenGated(
          await is721(saleWaveConfig.tokenGatedAddress, chainId!)
        );
        setSaleConfigs((prev) =>
          prev.map((sc) =>
            sc.saleIdentifier !== saleWaveConfig.saleIdentifier
              ? sc
              : {
                  ...sc,
                  saleType: "private",
                  maxMintPerWallet: 0,
                }
          )
        );
      } catch (error) {
        setIsTokenGated(false);
      }
    })();
  }, [
    chainId,
    saleWaveConfig.saleIdentifier,
    saleWaveConfig.tokenGatedAddress,
    setSaleConfigs,
  ]);

  return (
    <details className="p-2 m-3 border-2 rounded-xl bg-gray-800">
      <summary className="flex items-center w-full">
        <span className="cursor-pointer select-none w-full font-bold text-xl">
          Wave {index + 1}
          <span className="font-light mx-2 text-xs">
            {normalizeString(saleWaveConfig.saleType)}
          </span>
          {/* <span className="font-light mx-2 text-xs hidden sm:inline">
            {saleWaveConfig.saleIdentifier.substring(0, 8)}
          </span> */}
          {saleWaveConfig.invalid && (
            <span className="font-light text-red-800 mx-2 text-xs hidden sm:inline">
              This Sale Will end before the end of previous sale
            </span>
          )}
        </span>
        <button
          onClick={() =>
            setSaleConfigs((prev) =>
              prev.filter(
                (sc) => sc.saleIdentifier !== saleWaveConfig.saleIdentifier
              )
            )
          }
          className="text-red-500 hover:text-red-700 hover:bg-gray-100 rounded p-1 transition-colors"
        >
          Delete
        </button>
      </summary>
      <div>
        <div className="flex flex-col sm:flex-row my-1 gap-2">
          {saleWaveConfig.invalid && (
            <div className="font-light text-red-800 text-center mx-2 text-xs sm:hidden">
              This Sale Will end before the end of previous sale
            </div>
          )}
          <div className="w-full font-medium">Status</div>
          <div className="w-full bg-gray-700 p-1 rounded">
            <select
              value={saleWaveConfig.enabled ? "enabled" : "disabled"}
              onChange={(e) =>
                setSaleConfigs((prev) =>
                  prev.map((sc) =>
                    sc.saleIdentifier !== saleWaveConfig.saleIdentifier
                      ? sc
                      : {
                          ...sc,
                          enabled: e.target.value === "enabled",
                        }
                  )
                )
              }
              className="border-none bg-transparent p-1 w-full disabled:text-gray-400"
            >
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row my-1 gap-2">
          <div className="w-full font-medium">Wave Type</div>
          <div className="w-full bg-gray-700 p-1 rounded">
            <select
              value={saleWaveConfig.saleType}
              onChange={(e) =>
                setSaleConfigs((prev) =>
                  prev.map((sc) =>
                    sc.saleIdentifier !== saleWaveConfig.saleIdentifier
                      ? sc
                      : {
                          ...sc,
                          saleType: e.target.value as "private" | "public",
                        }
                  )
                )
              }
              className="border-none bg-transparent p-1 w-full disabled:text-gray-400"
            >
              <option value="private">Private</option>
              {!(collectionType === "721" && isTokenGated) && (
                <option value="public">Public</option>
              )}
            </select>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row my-1 gap-2">
          <div className="w-full flex justify-between items-center font-medium">
            <h1 className="leading-none">
              Start Time <br />
              <span className="text-xs font-normal">
                ( {new Date().toString().match(/\(([^\)]+)\)$/)?.[1]} )
              </span>
            </h1>
            <div>
              <button
                className="bg-gray-700 p-1 rounded text-blue-400 hover:text-blue-500 transition-colors"
                onClick={() =>
                  setSaleConfigs((prev) =>
                    prev.map((sc) =>
                      sc.saleIdentifier !== saleWaveConfig.saleIdentifier
                        ? sc
                        : {
                            ...sc,
                            startTime: Date.now() / 1000,
                          }
                    )
                  )
                }
              >
                Today
              </button>
            </div>
          </div>
          <div className="w-full flex bg-gray-700 rounded p-1">
            <input
              className="w-full bg-transparent disabled:text-gray-400"
              type="datetime-local"
              value={formatHtmlDateTime(
                new Date(saleWaveConfig.startTime * 1000)
              )}
              onChange={(e) =>
                setSaleConfigs((prev) =>
                  prev.map((sc) =>
                    sc.saleIdentifier !== saleWaveConfig.saleIdentifier
                      ? sc
                      : {
                          ...sc,
                          startTime: +new Date(e.target.value) / 1000,
                        }
                  )
                )
              }
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row my-1 gap-2">
          <div className="w-full flex justify-between items-center font-medium">
            <h1 className="leading-none">
              End Time <br />
              <span className="text-xs font-normal">
                ( {new Date().toString().match(/\(([^\)]+)\)$/)?.[1]} )
              </span>
            </h1>
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1 bg-gray-700 p-1 rounded text-blue-400 hover:text-blue-500 transition-colors cursor-pointer select-none">
                <input
                  className="cursor-pointer select-none"
                  ref={checkboxRef}
                  type="checkbox"
                  checked={saleWaveConfig.endTime === 0}
                  onChange={(e) =>
                    setSaleConfigs((prev) =>
                      prev.map((sc) =>
                        sc.saleIdentifier !== saleWaveConfig.saleIdentifier
                          ? sc
                          : {
                              ...sc,
                              endTime: e.target.checked
                                ? 0
                                : (Date.now() + 604800000) / 1000,
                            }
                      )
                    )
                  }
                />
                <label
                  onClick={() => {
                    if (checkboxRef.current) {
                      checkboxRef.current.click();
                    }
                  }}
                  className="cursor-pointer select-none whitespace-nowrap"
                >
                  No End
                </label>
              </div>
              <button
                onClick={() =>
                  setSaleConfigs((prev) =>
                    prev.map((sc) =>
                      sc.saleIdentifier !== saleWaveConfig.saleIdentifier
                        ? sc
                        : {
                            ...sc,
                            endTime: Date.now() / 1000,
                          }
                    )
                  )
                }
                className="bg-gray-700 p-1 rounded text-blue-400 hover:text-blue-500 transition-colors"
              >
                Today
              </button>
            </div>
          </div>
          <div className="w-full flex bg-gray-700 rounded p-1">
            {saleWaveConfig.endTime === 0 ? (
              <input
                type="text"
                readOnly
                disabled
                className="w-full bg-transparent disabled:text-gray-400"
                value="No Limit"
              />
            ) : (
              <input
                className="w-full bg-transparent disabled:text-gray-400"
                type="datetime-local"
                value={formatHtmlDateTime(
                  new Date(saleWaveConfig.endTime * 1000)
                )}
                onChange={(e) =>
                  setSaleConfigs((prev) =>
                    prev.map((sc) =>
                      sc.saleIdentifier !== saleWaveConfig.saleIdentifier
                        ? sc
                        : {
                            ...sc,
                            endTime: +new Date(e.target.value) / 1000,
                          }
                    )
                  )
                }
              />
            )}
          </div>
        </div>
        {collectionType === "721" && (
          <div className="mt-4 space-y-2">
            <label className="font-bold">Token Gated Contract Address</label>
            <p className="text-sm text-gray-300">
              Max Mint per wallet is dependent on this collection
            </p>
            {saleWaveConfig.tokenGatedAddress !== "" && !isTokenGated && (
              <>
                <br />
                <span className="text-sm text-red-500">
                  Invalid ERC721 address, Please put a valid ERC721 contract
                  address or remove it for non-token gated sale wave.
                </span>
              </>
            )}
            <input
              className="w-full rounded bg-gray-700 h-14 p-3 focus:bg-gray-800 transition-colors"
              type="text"
              placeholder="Token Gated Contract Address"
              defaultValue={saleWaveConfig.tokenGatedAddress}
              onChange={(e) =>
                setSaleConfigs((prev) =>
                  prev.map((sc) =>
                    sc.saleIdentifier !== saleWaveConfig.saleIdentifier
                      ? sc
                      : {
                          ...sc,
                          tokenGatedAddress: e.target.value,
                        }
                  )
                )
              }
            />
          </div>
        )}
        <div className="mt-4 space-y-2">
          <label className="font-bold">
            Mint Charge <span className="text-red-700">*</span>
          </label>
          <p className="text-sm text-gray-300">
            Charge in ETH buyer will pay in this sale
          </p>
          <input
            className="w-full rounded bg-gray-700 h-14 p-3 focus:bg-gray-800 transition-colors"
            type="number"
            min={0}
            step={0.00001}
            placeholder="0 (Equivalent to Free-Mint)"
            defaultValue={saleWaveConfig.mintCharge}
            onChange={(e) =>
              setSaleConfigs((prev) =>
                prev.map((sc) =>
                  sc.saleIdentifier !== saleWaveConfig.saleIdentifier
                    ? sc
                    : {
                        ...sc,
                        mintCharge:
                          isNaN(+e.target.value) || e.target.value === ""
                            ? 0
                            : e.target.valueAsNumber,
                      }
                )
              )
            }
          />
        </div>
        {!(collectionType === "721" && isTokenGated) && (
          <div className="mt-4 space-y-2">
            <label className="font-bold">
              Max Mint Per Wallet <span className="text-red-700">*</span>
            </label>
            <p className="text-sm text-gray-300">
              Max a wallet can mint in this salewave
            </p>
            <input
              className="w-full rounded bg-gray-700 h-14 p-3 focus:bg-gray-800 transition-colors"
              type="number"
              min={0}
              value={saleWaveConfig.maxMintPerWallet || ""}
              placeholder="0 (Equivalent to Mint-Disabled)"
              onChange={(e) =>
                setSaleConfigs((prev) =>
                  prev.map((sc) =>
                    sc.saleIdentifier !== saleWaveConfig.saleIdentifier
                      ? sc
                      : {
                          ...sc,
                          maxMintPerWallet:
                            isNaN(+e.target.value) || e.target.value === ""
                              ? 0
                              : +e.target.valueAsNumber.toFixed(0),
                        }
                  )
                )
              }
            />
          </div>
        )}
        <div className="mt-4 space-y-2">
          <label className="font-bold">
            Max Mint In Sale <span className="text-red-700">*</span>
          </label>
          <p className="text-sm text-gray-300">
            Max number of mint in this salewave
          </p>
          <input
            className="w-full rounded bg-gray-700 h-14 p-3 focus:bg-gray-800 transition-colors"
            type="number"
            placeholder="0 (Equivalent to Mint-Disabled)"
            min={0}
            value={saleWaveConfig.maxMintInSale || ""}
            onChange={(e) =>
              setSaleConfigs((prev) =>
                prev.map((sc) =>
                  sc.saleIdentifier !== saleWaveConfig.saleIdentifier
                    ? sc
                    : {
                        ...sc,
                        maxMintInSale:
                          isNaN(+e.target.value) || e.target.value === ""
                            ? 0
                            : +e.target.valueAsNumber.toFixed(0),
                      }
                )
              )
            }
          />
        </div>
        {saleWaveConfig.saleType === "private" && (
          <>
            <div>
              <div className="mt-4 space-y-2">
                <input
                  type="file"
                  hidden
                  ref={whitelistCsvInputRef}
                  accept=".csv"
                  onChange={(e) => {
                    if (!e.target.files || !e.target.files[0]) return;
                    parseCsv<string[]>(e.target.files[0], {
                      complete: (results) => {
                        setSaleConfigs((prev) =>
                          prev.map((sc) =>
                            sc.saleIdentifier !== saleWaveConfig.saleIdentifier
                              ? sc
                              : {
                                  ...sc,
                                  whitelist: [
                                    ...sc.whitelist,
                                    ...results.data
                                      .map((arr) => ({
                                        address: arr[0],
                                        limit: +arr[1],
                                      }))
                                      .filter(
                                        (item) =>
                                          typeof item.address === "string" &&
                                          isAddress(item.address) &&
                                          !isNaN(item.limit)
                                      ),
                                  ],
                                }
                          )
                        );
                        e.target.value = "";
                      },
                    });
                  }}
                />
                <label className="font-bold">Add Whitelist addresses</label>
                <p className="text-sm text-gray-300">
                  Only whitelisted addresses can mint in private sale. Add a
                  signle wallet here or add in batch using CSV.
                </p>
                <div>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                      className="w-full sm:w-[85%] rounded bg-gray-700 h-14 p-3 focus:bg-gray-800 transition-colors"
                      type="text"
                      placeholder="Address"
                      value={tempWl.address}
                      onChange={(e) =>
                        setTempWl((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                    />
                    <input
                      className="w-full sm:w-[15%] rounded bg-gray-700 h-14 p-3 focus:bg-gray-800 transition-colors"
                      placeholder="Limit"
                      type="text"
                      value={tempWl.limit || ""}
                      onChange={(e) =>
                        setTempWl((prev) => ({
                          ...prev,
                          limit: +(+e.target.value).toFixed(0),
                        }))
                      }
                    />
                    <button
                      onClick={() => {
                        if (!isAddress(tempWl.address)) {
                          toast.error("Invalid Address");
                          return;
                        }
                        setSaleConfigs((prev) =>
                          prev.map((sc) =>
                            sc.saleIdentifier !== saleWaveConfig.saleIdentifier
                              ? sc
                              : {
                                  ...sc,
                                  whitelist: [
                                    ...sc.whitelist.filter(
                                      (wl) => wl.address !== tempWl.address
                                    ),
                                    {
                                      address: tempWl.address,
                                      limit: tempWl.limit,
                                    },
                                  ],
                                }
                          )
                        );
                        setTempWl({ address: "", limit: 0 });
                      }}
                      className="bg-blue-600 text-white h-8 sm:h-14 w-full sm:w-28 rounded"
                    >
                      Add <span className="sm:hidden">Single^</span>
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 text-lg justify-end items-center my-4">
                    <button
                      onClick={() =>
                        whitelistCsvInputRef.current &&
                        whitelistCsvInputRef.current.click()
                      }
                      className="bg-blue-600 text-white h-8 w-full sm:w-40 rounded"
                    >
                      Attach CSV
                    </button>
                    <Link href={`/example/addresses.csv`} passHref>
                      <button className="bg-blue-600 text-white h-8 w-full sm:w-40 rounded">
                        Example CSV
                      </button>
                    </Link>
                    <button
                      onClick={() =>
                        setSaleConfigs((prev) =>
                          prev.map((sc) =>
                            sc.saleIdentifier !== saleWaveConfig.saleIdentifier
                              ? sc
                              : { ...sc, whitelist: [] }
                          )
                        )
                      }
                      className="bg-blue-600 text-white h-8 w-full sm:w-40 rounded"
                    >
                      Reset List
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {saleWaveConfig.whitelist.length === 0 && (
              <div className="text-center text-gray-300 my-4">
                No address is currently in whitelist
              </div>
            )}
            {saleWaveConfig.whitelist.length > 0 && (
              <div className="text-center text-gray-300 my-4">
                {saleWaveConfig.whitelist.length} address(es) in whitelist
              </div>
            )}
            {saleWaveConfig.whitelist.length > 0 && (
              <div className="my-4">
                <details open>
                  <summary className="cursor-pointer hover:text-gray-400">
                    Whitelisted Addresses
                  </summary>
                  <div className="max-h-96 overflow-y-scroll">
                    {saleWaveConfig.whitelist.map((wl, index) => (
                      <div
                        className="flex gap-4 relative my-2"
                        key={index + JSON.stringify(wl)}
                      >
                        <div className="w-full overflow-hidden group">
                          <div className="overflow-hidden flex gap-2 items-center w-full">
                            <div className="hidden sm:block">
                              <CopyAddressToClipboard address={wl.address} />
                            </div>
                            <div className="sm:hidden">
                              <CopyAddressToClipboard
                                shorten
                                address={wl.address}
                              />
                            </div>
                            <span>{wl.limit}</span>
                          </div>
                          {/* <div className="absolute -top-6 hidden group-hover:block text-sm rounded shdaow-xl bg-gray-500 p-1 text-white z-10">
                            {address}
                          </div> */}
                        </div>
                        <button
                          onClick={() =>
                            setSaleConfigs((prev) =>
                              prev.map((sc) =>
                                sc.saleIdentifier !==
                                saleWaveConfig.saleIdentifier
                                  ? sc
                                  : {
                                      ...sc,
                                      whitelist: sc.whitelist.filter(
                                        (wlm) => wl.address !== wlm.address
                                      ),
                                    }
                              )
                            )
                          }
                          className="hover:bg-gray-500 rounded-full overflow-hidden h-8 w-8 hover:text-white transition-colors flex justify-center items-center"
                        >
                          <CloseIcon />
                        </button>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}
          </>
        )}
      </div>
    </details>
  );
};

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
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

export default SaleConfigItem;
