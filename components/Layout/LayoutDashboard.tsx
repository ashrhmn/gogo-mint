import { useEthers, shortenIfAddress } from "@usedapp/core";
import Link from "next/link";
import React from "react";
import { walletConnectConnector } from "../../lib/connectors";

const LayoutDashboard = ({ children }: { children: React.ReactNode }) => {
  const { activateBrowserWallet, account, deactivate, activate } = useEthers();
  return (
    <>
      <div className="fixed shadow-md shadow-gray-300 top-0 left-0 right-0 z-40 bg-white">
        <nav className="flex max-w-6xl mx-auto justify-between items-center px-4 bg-white h-12 sm:h-16">
          <div className="w-0 sm:w-auto overflow-hidden text-3xl font-bold">
            Logo
          </div>
          <div className="flex text-sm sm:text-lg sm:gap-2 items-center overflow-auto">
            {/* <Link href={`/mint`}>
              <a className="p-2 font-bold text-gray-600 hover:text-black transition-colors">
                Mint
              </a>
            </Link> */}
            <Link href={`/dashboard`}>
              <a className="p-1 font-bold text-gray-600 hover:text-black transition-colors">
                Dashboard
              </a>
            </Link>
            <Link href={`/authenticate`}>
              <a className="p-1 font-bold text-gray-600 hover:text-black transition-colors">
                <span className="sm:hidden">Auth</span>
                <span className="hidden sm:block">Authenticate</span>
              </a>
            </Link>
            <div
              className="flex items-center justify-center group p-1 font-bold text-gray-600 hover:text-black cursor-pointer w-36 border-2 rounded bg-gray-200 hover:bg-white transition-colors"
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
                  <button
                    // onClick={deactivate}
                    className="hidden group-hover:block w-full"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <>
                  <button
                  // onClick={() => {
                  //   if (!!(window as any).ethereum) {
                  //     activateBrowserWallet();
                  //   } else {
                  //     activate(walletConnectConnector)
                  //       .then(console.log)
                  //       .catch(console.error);
                  //   }
                  // }}
                  >
                    Connect
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>
      </div>
      <main className="max-w-7xl mx-auto mt-20 p-4">{children}</main>
    </>
  );
};

export default LayoutDashboard;
