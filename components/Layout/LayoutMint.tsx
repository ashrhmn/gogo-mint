import { useEthers, shortenIfAddress } from "@usedapp/core";
import Image from "next/image";

import React from "react";
import { walletConnectConnector } from "../../lib/connectors";

const LayoutMint = ({ children }: { children: React.ReactNode }) => {
  const { activateBrowserWallet, account, deactivate, activate } = useEthers();
  return (
    <>
      <div className="fixed shadow-md top-0 left-0 right-0 z-40 bg-[#0e001c]">
        <nav className="flex max-w-6xl mx-auto justify-between items-center px-4 bg-[#0e001c] h-16">
          <div className="w-0 sm:w-16 sm:h-14 overflow-hidden relative text-3xl font-bold">
            <Image src={"/assets/logo-main.png"} alt="" layout="fill" />
          </div>
          <div className="flex overflow-auto">
            <a
              target="_blank"
              href={`/link-wallet`}
              className="p-2 font-bold text-gray-300 hover:text-white transition-colors"
              rel="noreferrer"
            >
              Link Wallet
            </a>

            <div
              className="flex items-center justify-center group p-1 font-bold text-gray-300 hover:text-gray-200 cursor-pointer w-36 border-2 rounded bg-gray-900 hover:bg-gray-800 transition-colors"
              onClick={
                !!account
                  ? deactivate
                  : () => {
                      if (!!(window as any).ethereum) {
                        activateBrowserWallet();
                      } else {
                        activate(walletConnectConnector)
                          .then(console.log)
                          .catch(console.error);
                      }
                    }
              }
            >
              {account ? (
                <>
                  <span className="group-hover:hidden">
                    {shortenIfAddress(account)}
                  </span>
                  <button className="hidden group-hover:block w-full">
                    Disconnect
                  </button>
                </>
              ) : (
                <>
                  <button>Connect</button>
                </>
              )}
            </div>
          </div>
        </nav>
      </div>
      <main className="mx-auto mt-20 text-white">{children}</main>
    </>
  );
};

export default LayoutMint;
