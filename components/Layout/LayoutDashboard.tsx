import { useEthers, shortenIfAddress } from "@usedapp/core";
import Link from "next/link";
import React from "react";

const LayoutDashboard = ({ children }: { children: React.ReactNode }) => {
  const { activateBrowserWallet, account, deactivate } = useEthers();
  return (
    <>
      <div className="fixed shadow-md shadow-gray-300 top-0 left-0 right-0 z-40 bg-white">
        <nav className="flex max-w-6xl mx-auto justify-between items-center px-4 bg-white h-16">
          <div className="w-0 sm:w-auto overflow-hidden text-3xl font-bold">
            Logo
          </div>
          <div className="flex overflow-auto">
            <Link href={`/mint`}>
              <a className="p-2 font-bold text-gray-600 hover:text-black transition-colors">
                Mint
              </a>
            </Link>
            <Link href={`/dashboard`}>
              <a className="p-2 font-bold text-gray-600 hover:text-black transition-colors">
                Dashboard
              </a>
            </Link>
            <Link href={`/authenticate`}>
              <a className="p-2 font-bold text-gray-600 hover:text-black transition-colors">
                Authenticate
              </a>
            </Link>
            <div className="sm:flex hidden items-center justify-center group p-2 font-bold text-gray-600 hover:text-black cursor-pointer w-36 border-2 rounded bg-gray-200 hover:bg-white transition-colors">
              {account ? (
                <>
                  <span className="group-hover:hidden">
                    {shortenIfAddress(account)}
                  </span>
                  <button
                    onClick={deactivate}
                    className="hidden group-hover:block w-full"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <>
                  <button onClick={activateBrowserWallet}>Connect</button>
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
