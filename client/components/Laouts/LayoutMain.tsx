import { shortenIfAddress, useEthers } from "@usedapp/core";
import Link from "next/link";
import React, { Children } from "react";

const LayoutMain = ({ children }: { children: React.ReactNode }) => {
  const { activateBrowserWallet, account, deactivate } = useEthers();
  return (
    <>
      <div className="fixed shadow-md shadow-gray-300 top-0 left-0 right-0 z-50 bg-white">
        <nav className="flex max-w-6xl mx-auto justify-between items-center px-4 z-50 bg-white h-16">
          <div>Logo</div>
          <div className="flex">
            <Link href={`/`}>
              <a className="p-2 font-bold text-gray-800 hover:text-black">
                Home
              </a>
            </Link>
            <Link href={`/dashboard`}>
              <a className="p-2 font-bold text-gray-800 hover:text-black">
                Dashboard
              </a>
            </Link>
            <Link href={`/authenticate`}>
              <a className="p-2 font-bold text-gray-800 hover:text-black">
                Authenticate
              </a>
            </Link>
            <div className="flex items-center justify-center group p-2 font-bold text-gray-800 hover:text-black cursor-pointer w-36 border-2 rounded bg-gray-200 hover:bg-white transition-colors">
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
      <main className="max-w-6xl mx-auto mt-20 p-4">{children}</main>
    </>
  );
};

export default LayoutMain;
