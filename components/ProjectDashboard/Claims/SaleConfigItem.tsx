import React, { useRef, useState } from "react";
import { formatHtmlDateTime } from "../../../utils/String.utils";
import { SaleConfig } from "@prisma/client";
import { parse as parseCsv } from "papaparse";
import { isAddress } from "ethers/lib/utils";
import toast from "react-hot-toast";

const SaleConfigItem = ({
  saleWaveConfig,
  setSaleConfigs,
  index,
}: {
  saleWaveConfig: SaleConfig;
  setSaleConfigs: React.Dispatch<React.SetStateAction<SaleConfig[]>>;
  index: number;
}) => {
  const [tempWhitelistAddress, setTempWhitelistAddress] = useState("");
  const whitelistCsvInputRef = useRef<HTMLInputElement | null>(null);
  const checkboxRef = useRef<HTMLInputElement | null>(null);
  return (
    <details className="p-2 m-3 border-2 rounded-xl bg-gray-200">
      <summary className="cursor-pointer select-none">Wave {index + 1}</summary>
      <div>
        <div className="flex flex-col sm:flex-row my-1 gap-2">
          <div className="w-full font-medium">Status</div>
          <div className="w-full bg-gray-100 p-1 rounded">
            <select
              value={saleWaveConfig.enabled ? "enabled" : "disabled"}
              //   onChange={(e) => {
              //     setConfigSet((prev) => ({
              //       ...prev,
              //       saleWaves: prev.saleWaves.map((sw) =>
              //         sw.uuid !== saleWaveConfig.uuid
              //           ? { ...sw }
              //           : { ...sw, enabled: e.target.value === "enabled" }
              //       ),
              //     }));
              //   }}
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
          <div className="w-full bg-gray-100 p-1 rounded">
            <select
              value={saleWaveConfig.saleType}
              //   onChange={(e) =>
              //     setConfigSet((prev) => ({
              //       ...prev,
              //       saleWaves: prev.saleWaves.map((sw) =>
              //         sw.uuid !== saleWaveConfig.uuid
              //           ? { ...sw }
              //           : {
              //               ...sw,
              //               saleType: e.target.value as "private" | "public",
              //             }
              //       ),
              //     }))
              //   }
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
              <option value="public">Public</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row my-1 gap-2">
          <div className="w-full flex justify-between items-center font-medium">
            <h1>Start Time</h1>
            <div>
              <button
                className="bg-gray-300 p-1 rounded text-blue-400 hover:text-blue-500 transition-colors"
                // onClick={() =>
                //   setConfigSet((prev) => ({
                //     ...prev,
                //     saleWaves: prev.saleWaves.map((sw) =>
                //       sw.uuid !== saleWaveConfig.uuid
                //         ? sw
                //         : { ...sw, startTime: Date.now() / 1000 }
                //     ),
                //   }))
                // }
                onClick={(e) =>
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
          <div className="w-full flex bg-gray-100 rounded p-1">
            <input
              className="w-full bg-transparent disabled:text-gray-400"
              type="datetime-local"
              value={formatHtmlDateTime(
                new Date(saleWaveConfig.startTime * 1000)
              )}
              //   onChange={(e) => {
              //     setConfigSet((prev) => ({
              //       ...prev,
              //       saleWaves: prev.saleWaves.map((sw) =>
              //         sw.uuid !== saleWaveConfig.uuid
              //           ? { ...sw }
              //           : { ...sw, startTime: +new Date(e.target.value) / 1000 }
              //       ),
              //     }));
              //   }}
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
            <h1>End Time</h1>
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1 bg-gray-300 p-1 rounded text-blue-400 hover:text-blue-500 transition-colors cursor-pointer select-none">
                <input
                  className="cursor-pointer select-none"
                  ref={checkboxRef}
                  type="checkbox"
                  checked={saleWaveConfig.endTime === 0}
                  //   onChange={(e) =>
                  //     setConfigSet((prev) => ({
                  //       ...prev,
                  //       saleWaves: prev.saleWaves.map((sw) =>
                  //         sw.uuid !== saleWaveConfig.uuid
                  //           ? sw
                  //           : {
                  //               ...sw,
                  //               endTime: e.target.checked
                  //                 ? 0
                  //                 : (Date.now() + 604800000) / 1000,
                  //             }
                  //       ),
                  //     }))
                  //   }
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
                  className="cursor-pointer select-none"
                >
                  No End
                </label>
              </div>
              <button
                // disabled={isNoEndChecked || !!saleConfigBgProc}
                // onClick={() =>
                //   setConfigSet((prev) => ({
                //     ...prev,
                //     saleWaves: prev.saleWaves.map((sw) =>
                //       sw.uuid !== saleWaveConfig.uuid
                //         ? sw
                //         : { ...sw, endTime: Date.now() / 1000 }
                //     ),
                //   }))
                // }
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
                className="bg-gray-300 p-1 rounded text-blue-400 hover:text-blue-500 transition-colors"
              >
                Today
              </button>
            </div>
          </div>
          <div className="w-full flex bg-gray-100 rounded p-1">
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
                // onChange={(e) => {
                //   setConfigSet((prev) => ({
                //     ...prev,
                //     saleWaves: prev.saleWaves.map((sw) =>
                //       sw.uuid !== saleWaveConfig.uuid
                //         ? { ...sw }
                //         : { ...sw, endTime: +new Date(e.target.value) / 1000 }
                //     ),
                //   }));
                // }}
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
        <div className="mt-4 space-y-2">
          <label className="font-bold">
            Mint Charge <span className="text-red-700">*</span>
          </label>
          <input
            className="w-full rounded bg-gray-100 h-14 p-3 focus:bg-white transition-colors"
            type="number"
            min={0}
            step={0.00001}
            value={saleWaveConfig.mintCharge}
            // onChange={(e) => {
            //   setConfigSet((prev) => ({
            //     ...prev,
            //     saleWaves: prev.saleWaves.map((sw) =>
            //       sw.uuid !== saleWaveConfig.uuid
            //         ? { ...sw }
            //         : { ...sw, mintCharge: e.target.valueAsNumber }
            //     ),
            //   }));
            // }}
            onChange={(e) =>
              setSaleConfigs((prev) =>
                prev.map((sc) =>
                  sc.saleIdentifier !== saleWaveConfig.saleIdentifier
                    ? sc
                    : {
                        ...sc,
                        mintCharge: e.target.valueAsNumber,
                      }
                )
              )
            }
          />
        </div>
        <div className="mt-4 space-y-2">
          <label className="font-bold">
            Max Mint Per Wallet <span className="text-red-700">*</span>
          </label>
          <input
            className="w-full rounded bg-gray-100 h-14 p-3 focus:bg-white transition-colors"
            type="number"
            min={0}
            value={saleWaveConfig.maxMintPerWallet}
            // onChange={(e) => {
            //   setConfigSet((prev) => ({
            //     ...prev,
            //     saleWaves: prev.saleWaves.map((sw) =>
            //       sw.uuid !== saleWaveConfig.uuid
            //         ? { ...sw }
            //         : { ...sw, maxMintPerWallet: e.target.valueAsNumber }
            //     ),
            //   }));
            // }}
            onChange={(e) =>
              setSaleConfigs((prev) =>
                prev.map((sc) =>
                  sc.saleIdentifier !== saleWaveConfig.saleIdentifier
                    ? sc
                    : {
                        ...sc,
                        maxMintPerWallet: e.target.valueAsNumber,
                      }
                )
              )
            }
          />
        </div>
        <div className="mt-4 space-y-2">
          <label className="font-bold">
            Max Mint In Sale <span className="text-red-700">*</span>
          </label>
          <input
            className="w-full rounded bg-gray-100 h-14 p-3 focus:bg-white transition-colors"
            type="number"
            min={0}
            value={saleWaveConfig.maxMintInSale}
            // onChange={(e) => {
            //   setConfigSet((prev) => ({
            //     ...prev,
            //     saleWaves: prev.saleWaves.map((sw) =>
            //       sw.uuid !== saleWaveConfig.uuid
            //         ? { ...sw }
            //         : { ...sw, maxMintInSale: e.target.valueAsNumber }
            //     ),
            //   }));
            // }}
            onChange={(e) =>
              setSaleConfigs((prev) =>
                prev.map((sc) =>
                  sc.saleIdentifier !== saleWaveConfig.saleIdentifier
                    ? sc
                    : {
                        ...sc,
                        maxMintInSale: e.target.valueAsNumber,
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
                      complete(results, file) {
                        setSaleConfigs((prev) =>
                          prev.map((sc) =>
                            sc.saleIdentifier !== saleWaveConfig.saleIdentifier
                              ? sc
                              : {
                                  ...sc,
                                  whitelist: [
                                    ...sc.whitelist,
                                    ...results.data
                                      .map((arr) => arr[0])
                                      .filter(
                                        (address) =>
                                          typeof address === "string" &&
                                          isAddress(address) &&
                                          !saleWaveConfig.whitelist.includes(
                                            address
                                          )
                                      ),
                                  ],
                                }
                          )
                        );
                      },
                    });
                  }}
                  //   onChange={(e) => {
                  //     if (!e.target.files || !e.target.files[0]) return;
                  //     parseCsv<string[]>(e.target.files[0], {
                  //       complete(results) {
                  //         setConfigSet((prev) => ({
                  //           ...prev,
                  //           saleWaves: prev.saleWaves.map((sw) =>
                  //             sw.uuid !== saleWaveConfig.uuid
                  //               ? sw
                  //               : {
                  //                   ...sw,
                  //                   whitelistAddresses: [
                  //                     ...sw.whitelistAddresses,
                  //                     ...results.data
                  //                       .map((arr) => arr[0])
                  //                       .filter(
                  //                         (address) =>
                  //                           typeof address === "string" &&
                  //                           isAddress(address) &&
                  //                           !saleWaveConfig.whitelistAddresses.includes(
                  //                             address
                  //                           )
                  //                       ),
                  //                   ],
                  //                 }
                  //           ),
                  //         }));
                  //       },
                  //     });
                  //   }}
                />
                <label className="font-bold">Add Whitelist addresses</label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    className="w-full rounded bg-gray-100 h-14 p-3 focus:bg-white transition-colors"
                    type="text"
                    value={tempWhitelistAddress}
                    onChange={(e) => setTempWhitelistAddress(e.target.value)}
                  />
                  <div className="flex gap-4 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        if (
                          saleWaveConfig.whitelist.includes(
                            tempWhitelistAddress
                          )
                        ) {
                          toast.error("Address already added");
                          setTempWhitelistAddress("");
                          return;
                        }
                        if (!isAddress(tempWhitelistAddress)) {
                          toast.error("Invalid Address");
                          setTempWhitelistAddress("");
                          return;
                        }
                        setSaleConfigs((prev) =>
                          prev.map((sc) =>
                            sc.saleIdentifier !== saleWaveConfig.saleIdentifier
                              ? sc
                              : {
                                  ...sc,
                                  whitelist: [
                                    ...sc.whitelist,
                                    tempWhitelistAddress,
                                  ],
                                }
                          )
                        );
                        setTempWhitelistAddress("");
                      }}
                      className="bg-blue-600 text-white h-14 w-full sm:w-28 rounded"
                    >
                      Add
                    </button>
                    <button
                      onClick={() =>
                        whitelistCsvInputRef.current &&
                        whitelistCsvInputRef.current.click()
                      }
                      className="bg-blue-600 text-white h-14 w-full sm:w-40 rounded"
                    >
                      Attach CSV
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {saleWaveConfig.whitelist.length > 0 && (
              <div className="my-4">
                <details open>
                  <summary className="cursor-pointer hover:text-gray-700">
                    Whitelisted Addresses
                  </summary>
                  <div className="max-h-96 overflow-y-scroll">
                    {saleWaveConfig.whitelist.map((address) => (
                      <div className="flex gap-4 relative my-2" key={address}>
                        <div className="w-full overflow-hidden group">
                          <div className="overflow-hidden w-full">
                            {address}
                          </div>
                          {/* <div className="absolute -top-6 hidden group-hover:block text-sm rounded shdaow-xl bg-gray-500 p-1 text-white z-10">
                            {address}
                          </div> */}
                        </div>
                        <button
                          //   onClick={() =>
                          //     setConfigSet((prev) => ({
                          //       ...prev,
                          //       saleWaves: prev.saleWaves.map((sw) =>
                          //         sw.uuid !== saleWaveConfig.uuid
                          //           ? sw
                          //           : {
                          //               ...sw,
                          //               whitelistAddresses:
                          //                 sw.whitelistAddresses.filter(
                          //                   (a) => a !== address
                          //                 ),
                          //             }
                          //       ),
                          //     }))
                          //   }
                          onClick={() =>
                            setSaleConfigs((prev) =>
                              prev.map((sc) =>
                                sc.saleIdentifier !==
                                saleWaveConfig.saleIdentifier
                                  ? sc
                                  : {
                                      ...sc,
                                      whitelist: sc.whitelist.filter(
                                        (a) => a !== address
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
