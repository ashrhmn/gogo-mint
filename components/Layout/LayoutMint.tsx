import { useEthers, shortenIfAddress } from "@usedapp/core";
import Link from "next/link";
import React from "react";
import { walletConnectConnector } from "../../lib/connectors";

const LayoutMint = ({ children }: { children: React.ReactNode }) => {
  const { activateBrowserWallet, account, deactivate, activate } = useEthers();
  return (
    <>
      <div className="fixed shadow-md shadow-gray-300 top-0 left-0 right-0 z-40 bg-white">
        <nav className="flex max-w-6xl mx-auto justify-between items-center px-4 bg-white h-16">
          <div className="w-0 sm:w-auto overflow-hidden text-3xl font-bold">
            Logo
          </div>
          <div className="flex overflow-auto">
            {/* <Link href={`/dashboard`}>
              <a className="p-2 font-bold text-gray-600 hover:text-black transition-colors">
                temp
              </a>
            </Link> */}
            {/* <Link href={`/mint`}>
              <a className="p-2 font-bold text-gray-600 hover:text-black transition-colors">
                All Projects
              </a>
            </Link> */}

            <a
              target="_blank"
              href={`/link-wallet`}
              className="p-2 font-bold text-gray-600 hover:text-black transition-colors"
              rel="noreferrer"
            >
              Link Wallet
            </a>

            <div
              className="flex items-center justify-center group p-2 font-bold text-gray-600 hover:text-black cursor-pointer w-36 border-2 rounded bg-gray-200 hover:bg-white transition-colors"
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
      <main className="mx-auto mt-20">{children}</main>
    </>
  );
};

export default LayoutMint;
