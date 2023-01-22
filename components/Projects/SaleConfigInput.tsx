import React, { useEffect, useRef, useState } from "react";
import { IDeployConfigSet, ISaleConfigInput } from "../../types";
import { formatHtmlDateTime, normalizeString } from "../../utils/String.utils";
import { parse as parseCsv } from "papaparse";
import { isAddress } from "ethers/lib/utils";
import toast from "react-hot-toast";
import Link from "next/link";
import { is721 } from "../../services/ethereum.service";
import { shortenIfAddress, useEthers } from "@usedapp/core";
import { ethers } from "ethers";

const SaleConfigInput = ({
  saleWaveConfig,
  setConfigSet,
  index,
  collectionType,
}: {
  saleWaveConfig: ISaleConfigInput;
  setConfigSet: React.Dispatch<React.SetStateAction<IDeployConfigSet>>;
  index: number;
  collectionType: "721" | "1155";
}) => {
  const [tempWl, setTempWl] = useState({ address: "", limit: 0 });
  const whitelistCsvInputRef = useRef<HTMLInputElement | null>(null);
  const { chainId } = useEthers();
  const [isTokenGated, setIsTokenGated] = useState(false);

  useEffect(() => {
    if (collectionType === "1155")
      setConfigSet((prev) => ({
        ...prev,
        saleWaves: prev.saleWaves.map((sw) =>
          sw.uuid !== saleWaveConfig.uuid
            ? { ...sw }
            : {
                ...sw,
                tokenGatedAddress: ethers.constants.AddressZero,
              }
        ),
      }));
    if (collectionType === "721")
      (async () => {
        try {
          setIsTokenGated(
            await is721(saleWaveConfig.tokenGatedAddress, chainId!)
          );
          setConfigSet((prev) => ({
            ...prev,
            saleWaves: prev.saleWaves.map((sw) =>
              sw.uuid !== saleWaveConfig.uuid
                ? { ...sw }
                : {
                    ...sw,
                    saleType: "private",
                    maxMintPerWallet: 0,
                  }
            ),
          }));
        } catch (error) {
          setIsTokenGated(false);
        }
      })();
  }, [
    chainId,
    collectionType,
    saleWaveConfig.tokenGatedAddress,
    saleWaveConfig.uuid,
    setConfigSet,
  ]);

  const checkboxRef = useRef<HTMLInputElement | null>(null);
  return (
    <details className="p-2 m-3 border-2 border-gray-600 rounded-xl bg-gray-800">
      <summary className="flex items-center w-full">
        <span className="cursor-pointer select-none w-full font-bold text-xl hover:text-blue-500 transition-colors">
          Wave {index + 1}
          <span className="font-light mx-2 text-xs">
            {normalizeString(saleWaveConfig.saleType)}
          </span>
        </span>
        <button
          onClick={() =>
            setConfigSet((prev) => ({
              ...prev,
              saleWaves: prev.saleWaves.filter(
                (sw) => sw.uuid !== saleWaveConfig.uuid
              ),
            }))
          }
          className="text-red-500 hover:text-red-700 hover:bg-gray-500 rounded p-1 transition-colors"
        >
          Delete
        </button>
      </summary>
      <div>
        <div className="flex flex-col sm:flex-row my-1 gap-2">
          <div className="w-full font-medium">Status</div>
          <div className="w-full bg-gray-700 p-1 rounded">
            <select
              value={saleWaveConfig.enabled ? "enabled" : "disabled"}
              onChange={(e) => {
                setConfigSet((prev) => ({
                  ...prev,
                  saleWaves: prev.saleWaves.map((sw) =>
                    sw.uuid !== saleWaveConfig.uuid
                      ? { ...sw }
                      : { ...sw, enabled: e.target.value === "enabled" }
                  ),
                }));
              }}
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
                setConfigSet((prev) => ({
                  ...prev,
                  saleWaves: prev.saleWaves.map((sw) =>
                    sw.uuid !== saleWaveConfig.uuid
                      ? { ...sw }
                      : {
                          ...sw,
                          saleType: e.target.value as "private" | "public",
                        }
                  ),
                }))
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
            <h1>
              Start Time{" "}
              <span className="text-xs font-normal">
                ( {new Date().toString().match(/\(([^\)]+)\)$/)?.[1]} )
              </span>
            </h1>
            <div>
              <button
                className="bg-gray-700 p-1 rounded text-blue-400 hover:text-blue-500 transition-colors"
                onClick={() =>
                  setConfigSet((prev) => ({
                    ...prev,
                    saleWaves: prev.saleWaves.map((sw) =>
                      sw.uuid !== saleWaveConfig.uuid
                        ? sw
                        : { ...sw, startTime: Date.now() / 1000 }
                    ),
                  }))
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
              onChange={(e) => {
                setConfigSet((prev) => ({
                  ...prev,
                  saleWaves: prev.saleWaves.map((sw) =>
                    sw.uuid !== saleWaveConfig.uuid
                      ? { ...sw }
                      : { ...sw, startTime: +new Date(e.target.value) / 1000 }
                  ),
                }));
              }}
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row my-1 gap-2">
          <div className="w-full flex justify-between items-center font-medium">
            <h1>
              End Time{" "}
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
                    setConfigSet((prev) => ({
                      ...prev,
                      saleWaves: prev.saleWaves.map((sw) =>
                        sw.uuid !== saleWaveConfig.uuid
                          ? sw
                          : {
                              ...sw,
                              endTime: e.target.checked
                                ? 0
                                : (Date.now() + 604800000) / 1000,
                            }
                      ),
                    }))
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
                  setConfigSet((prev) => ({
                    ...prev,
                    saleWaves: prev.saleWaves.map((sw) =>
                      sw.uuid !== saleWaveConfig.uuid
                        ? sw
                        : { ...sw, endTime: Date.now() / 1000 }
                    ),
                  }))
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
                onChange={(e) => {
                  setConfigSet((prev) => ({
                    ...prev,
                    saleWaves: prev.saleWaves.map((sw) =>
                      sw.uuid !== saleWaveConfig.uuid
                        ? { ...sw }
                        : { ...sw, endTime: +new Date(e.target.value) / 1000 }
                    ),
                  }));
                }}
              />
            )}
          </div>
        </div>
        {collectionType === "721" && (
          <div className="mt-4 space-y-2">
            <label className="font-bold">Token Gated Contract Address</label>
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
              defaultValue={saleWaveConfig.tokenGatedAddress}
              placeholder="Token Gated Contract Address"
              onChange={(e) => {
                setConfigSet((prev) => ({
                  ...prev,
                  saleWaves: prev.saleWaves.map((sw) =>
                    sw.uuid !== saleWaveConfig.uuid
                      ? { ...sw }
                      : {
                          ...sw,
                          tokenGatedAddress: e.target.value,
                        }
                  ),
                }));
              }}
            />
          </div>
        )}
        <div className="mt-4 space-y-2">
          <label className="font-bold">
            Mint Charge <span className="text-red-700">*</span>
          </label>
          <input
            className="w-full rounded bg-gray-700 h-14 p-3 focus:bg-gray-800 transition-colors"
            type="number"
            min={0}
            step={0.00001}
            defaultValue={saleWaveConfig.mintCharge}
            placeholder="0 (Equivalent to Free-Mint)"
            onChange={(e) => {
              setConfigSet((prev) => ({
                ...prev,
                saleWaves: prev.saleWaves.map((sw) =>
                  sw.uuid !== saleWaveConfig.uuid
                    ? { ...sw }
                    : {
                        ...sw,
                        mintCharge:
                          isNaN(+e.target.value) || e.target.value === ""
                            ? 0
                            : e.target.valueAsNumber,
                      }
                ),
              }));
            }}
          />
        </div>
        {!(collectionType === "721" && isTokenGated) && (
          <div className="mt-4 space-y-2">
            <label className="font-bold">
              Max Mint Per Wallet <span className="text-red-700">*</span>
            </label>
            <input
              className="w-full rounded bg-gray-700 h-14 p-3 focus:bg-gray-800 transition-colors"
              type="number"
              min={0}
              placeholder="0 (Equivalent to Mint-Disabled)"
              value={saleWaveConfig.maxMintPerWallet || ""}
              onChange={(e) => {
                setConfigSet((prev) => ({
                  ...prev,
                  saleWaves: prev.saleWaves.map((sw) =>
                    sw.uuid !== saleWaveConfig.uuid
                      ? { ...sw }
                      : {
                          ...sw,
                          maxMintPerWallet:
                            isNaN(+e.target.value) || e.target.value === ""
                              ? 0
                              : +e.target.valueAsNumber.toFixed(0),
                        }
                  ),
                }));
              }}
            />
          </div>
        )}
        <div className="mt-4 space-y-2">
          <label className="font-bold">
            Max Mint In Sale <span className="text-red-700">*</span>
          </label>
          <input
            className="w-full rounded bg-gray-700 h-14 p-3 focus:bg-gray-800 transition-colors"
            type="number"
            min={0}
            value={saleWaveConfig.maxMintInSale || ""}
            placeholder="0 (Equivalent to Mint-Disabled)"
            onChange={(e) => {
              setConfigSet((prev) => ({
                ...prev,
                saleWaves: prev.saleWaves.map((sw) =>
                  sw.uuid !== saleWaveConfig.uuid
                    ? { ...sw }
                    : {
                        ...sw,
                        maxMintInSale:
                          isNaN(+e.target.value) || e.target.value === ""
                            ? 0
                            : +e.target.valueAsNumber.toFixed(0),
                      }
                ),
              }));
            }}
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
                      complete(results) {
                        setConfigSet((prev) => ({
                          ...prev,
                          saleWaves: prev.saleWaves.map((sw) =>
                            sw.uuid !== saleWaveConfig.uuid
                              ? sw
                              : {
                                  ...sw,
                                  whitelistAddresses: [
                                    ...sw.whitelistAddresses.filter(
                                      (wl) =>
                                        !results.data
                                          .map((arr) => arr[0])
                                          .includes(wl.address)
                                    ),
                                    ...results.data
                                      .map((arr) => ({
                                        address: arr[0],
                                        limit: +arr[1],
                                      }))
                                      .filter(
                                        (wl) =>
                                          typeof wl.address === "string" &&
                                          isAddress(wl.address) &&
                                          !isNaN(wl.limit)
                                      ),
                                  ],
                                }
                          ),
                        }));
                        e.target.value = "";
                      },
                    });
                  }}
                />
                <label className="font-bold">Add Whitelist addresses</label>
                <div className="flex items-center gap-3">
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
                      setConfigSet((prev) => ({
                        ...prev,
                        saleWaves: prev.saleWaves.map((sw) =>
                          sw.uuid !== saleWaveConfig.uuid
                            ? sw
                            : {
                                ...sw,
                                whitelistAddresses: [
                                  ...sw.whitelistAddresses.filter(
                                    (wl) => wl.address !== tempWl.address
                                  ),
                                  {
                                    address: tempWl.address,
                                    limit: tempWl.limit,
                                  },
                                ],
                              }
                        ),
                      }));
                      setTempWl({ address: "", limit: 0 });
                    }}
                    className="bg-blue-600 text-white h-14 w-36 sm:w-28 rounded"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 text-lg justify-end items-center">
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
                      setConfigSet((prev) => ({
                        ...prev,
                        saleWaves: prev.saleWaves.map((sw) =>
                          sw.uuid !== saleWaveConfig.uuid
                            ? sw
                            : { ...sw, whitelistAddresses: [] }
                        ),
                      }))
                    }
                    className="bg-blue-600 text-white h-8 w-full sm:w-40 rounded"
                  >
                    Reset List
                  </button>
                </div>
              </div>
            </div>
            {saleWaveConfig.whitelistAddresses.length === 0 && (
              <div className="text-center text-gray-300 my-4">
                No address is currently in whitelist
              </div>
            )}
            {saleWaveConfig.whitelistAddresses.length > 0 && (
              <div className="text-center text-gray-300 my-4">
                {saleWaveConfig.whitelistAddresses.length} address(es) in
                whitelist
              </div>
            )}
            {saleWaveConfig.whitelistAddresses.length > 0 && (
              <div className="my-4">
                <details open>
                  <summary className="cursor-pointer hover:text-gray-300">
                    Whitelisted Addresses
                  </summary>
                  <div className="max-h-96 overflow-y-scroll">
                    {saleWaveConfig.whitelistAddresses.map((wl) => (
                      <div
                        className="flex gap-4 relative my-2"
                        key={wl.address}
                      >
                        <div className="w-full overflow-hidden group">
                          <div className="overflow-hidden w-full">
                            <div className="flex gap-3">
                              <span className="hidden md:block">
                                {wl.address}
                              </span>
                              <span className="md:hidden">
                                {shortenIfAddress(wl.address)}
                              </span>
                              <span>{wl.limit}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            setConfigSet((prev) => ({
                              ...prev,
                              saleWaves: prev.saleWaves.map((sw) =>
                                sw.uuid !== saleWaveConfig.uuid
                                  ? sw
                                  : {
                                      ...sw,
                                      whitelistAddresses:
                                        sw.whitelistAddresses.filter(
                                          (wlm) => wlm.address !== wl.address
                                        ),
                                    }
                              ),
                            }))
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

export default SaleConfigInput;
