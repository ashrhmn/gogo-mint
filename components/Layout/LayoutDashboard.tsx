import { useEthers, shortenIfAddress } from "@usedapp/core";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { walletConnectConnector } from "../../lib/connectors";
import DisclaimerModal from "../ProjectDashboard/DisclaimerModal";

const LayoutDashboard = ({ children }: { children: React.ReactNode }) => {
  const { activateBrowserWallet, account, deactivate, activate } = useEthers();
  return (
    <>
      <DisclaimerModal />
      <div className="fixed top-0 left-0 right-0 z-40 bg-[#0e001c]">
        <nav className="flex max-w-6xl mx-auto justify-between items-center px-4 bg-[#0e001c] h-12 sm:h-16">
          <Link href={"/"} passHref>
            <a className="w-0 sm:w-14 sm:h-12 overflow-hidden relative text-3xl font-bold">
              <Image src={"/assets/logo-main.png"} alt="" layout="fill" />
            </a>
          </Link>
          <div className="flex text-sm sm:text-lg sm:gap-2 items-center overflow-auto">
            <Link href={`/dashboard`}>
              <a className="p-1 font-bold text-gray-300 hover:text-white transition-colors">
                Dashboard
              </a>
            </Link>
            <Link href={`/authenticate`}>
              <a className="p-1 font-bold text-gray-300 hover:text-white transition-colors">
                <span className="sm:hidden">Auth</span>
                <span className="hidden sm:block">Authenticate</span>
              </a>
            </Link>
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
      <main className="max-w-7xl mx-auto pt-20 p-4 text-white">{children}</main>
    </>
  );
};

export default LayoutDashboard;
