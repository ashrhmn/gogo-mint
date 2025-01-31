import { shortenIfAddress, useEthers } from "@usedapp/core";
import { GetServerSideProps, NextPage } from "next";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { service } from "../service";
import { DiscordUserResponse } from "../types";
import { randomIntFromInterval } from "../utils/Number.utils";
import Image from "next/image";
import Link from "next/link";
import {
  DISCORD_AUTH_URL,
  getMessageToSignOnAuth,
} from "../constants/configuration";
import { getHttpCookie } from "../utils/Request.utils";
import toast from "react-hot-toast";
import assert from "assert";
import { getCookieWallet } from "../services/auth.service";
import Layout from "../components/Layout";
import { getLoggedInDiscordUser } from "../services/user.service";
import { walletConnectConnector } from "../lib/connectors";
import { DiscordIcon } from "../components/SVGs/SocialIcons";
import MetamaskIcon from "../components/SVGs/MetamaskIcon";
import WalletConnectIcon from "../components/SVGs/WalletConnectIcon";

interface Props {
  user?: DiscordUserResponse;
  msg: string | null;
  cookieAddress: string | null;
}

const AuthenticatePage: NextPage<Props> = ({ user, msg, cookieAddress }) => {
  const { account, deactivate, activateBrowserWallet, library, activate } =
    useEthers();
  // const [connectedUser, setConnectedUser] = useState<User | null>();
  // const [connectedWallet, setConnectedWallet] = useState<string | null>("");
  // const [bgProcesses, setBgProcesses] = useState(0);
  // const [refetcher, setRefetcher] = useState(false);
  const router = useRouter();
  useEffect(() => {
    let id: string | number | NodeJS.Timeout | undefined;
    if (msg) {
      id = setTimeout(() => {
        toast.error(msg, { id: "page_msg" });
      }, 1000);
    }
    if (id) return () => clearTimeout(id);
  }, [msg, router.query.msg]);

  // useEffect(() => {
  //   if (user) {
  //     // setBgProcesses((v) => v + 1);
  //     service.get(
  //       `/users?username=${user.username}&discriminator=${user.discriminator}`
  //     );
  //     // .then(
  //     //   ({
  //     //     data: { data: user, error },
  //     //   }: {
  //     //     data: { data: User; error: any };
  //     //   }) => {
  //     //     // setBgProcesses((v) => v - 1);
  //     //     // setConnectedWallet(!!user ? user.walletAddress : null);
  //     //   }
  //     // )
  //     // .catch((err) => {
  //     //   console.log(err);
  //     //   // setConnectedWallet("");
  //     //   // setBgProcesses((v) => v - 1);
  //     // });
  //   }
  // }, [user, refetcher]);
  const handleLogoutClick = async () => {
    await service.get("/auth/discord/logout");
    router.reload();
  };

  // useEffect(() => {
  //   if (account) {
  //     // setBgProcesses((v) => v + 1);
  //     service
  //       .get(`/users?address=${account}`)
  //       .then(
  //         ({
  //           data: { data: user, error },
  //         }: {
  //           data: { data: User; error: any };
  //         }) => {
  //           console.log(error);
  //           console.log("Fetched user : ", user);
  //           setBgProcesses((v) => v - 1);
  //           setConnectedUser(error ? null : user);
  //         }
  //       )
  //       .catch((err) => {
  //         console.log(err);
  //         setBgProcesses((v) => v - 1);
  //         setConnectedUser(null);
  //       });
  //   }
  // }, [account, refetcher]);
  // const handleLinkAccountClick = async () => {
  //   if (!user || !account) {
  //     return;
  //   }
  //   if (!connectedUser) {
  //     toast.error("Sign is Required");
  //     return;
  //   }

  //   if (cookieAddress !== account) {
  //     toast.error(
  //       `Signed in wallet is ${shortenIfAddress(
  //         cookieAddress
  //       )}, but connected wallet is ${shortenIfAddress(account)}`
  //     );
  //     return;
  //   }

  //   // setBgProcesses((v) => v + 1);
  //   const { data: response } = await toast.promise(
  //     service.post("/auth/discord/link", {
  //       username: user.username,
  //       discriminator: +user.discriminator,
  //       address: account,
  //     }),
  //     {
  //       loading: "Linking account...",
  //       success: "Account linked successfully!",
  //       error: "Error linking account!",
  //     }
  //   );
  //   service.post(`discord/refresh-role-integrations`, {
  //     walletAddress: account,
  //   }),
  //     setRefetcher((v) => !v);
  //   setBgProcesses((v) => v - 1);
  //   if (!response.error) {
  //   } else {
  //     console.log(response.error);
  //   }
  // };

  const handleSignClick = async () => {
    try {
      assert(account && library, "Please connect Wallet");
      const signature = await toast.promise(
        library.getSigner(account).signMessage(getMessageToSignOnAuth(account)),
        {
          error: "Error getting signature",
          loading: "Awaiting signature approval...",
          success: "Signed",
        }
      );
      // console.log("Sig : ", signature);
      await toast.promise(
        service.post(`/auth/wallet/login`, {
          address: account,
          signature,
        }),
        {
          error: "Error loging in",
          loading: "Logging you in...",
          success: "Logged in",
        }
      );
      // console.log(res.data);
      service.post(`discord/refresh-role-integrations`, {
        walletAddress: account,
      }),
        router.reload();
    } catch (error: any) {
      console.error(error);
      if (error.message && typeof error.message === "string")
        toast.error(error.message);
    }
  };

  return (
    <Layout dashboard>
      <div className="flex flex-col lg:flex-row text-3xl justify-center mt-10 text-center gap-10">
        {account ? (
          <div className="flex flex-col gap-6 items-center w-full">
            <h1 className="font-bold">Wallet Connected</h1>
            <div className="bg-gray-700 text-white p-8 rounded-xl flex flex-col sm:flex-row items-center gap-6 max-w-md sm:w-full">
              <h1>{shortenIfAddress(account)}</h1>
              <button
                className="bg-red-500 text-white rounded text-2xl p-2 w-40 hover:bg-red-700 transition-colors"
                onClick={deactivate}
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col justify-center items-center">
            <h1 className="font-bold">Wallet not connected</h1>
            <p className="text-sm text-gray-500 px-6 text-center">
              Connecting wallet is required to enter your dashboard
            </p>
            <button
              className="mt-6 bg-gray-700 p-4 rounded-xl w-full max-w-md text-white text-center hover:text-blue-400 transition-colors flex justify-center items-center"
              onClick={activateBrowserWallet}
            >
              <MetamaskIcon />
            </button>
            <button
              onClick={() =>
                activate(walletConnectConnector)
                  .then(console.log)
                  .catch(console.error)
              }
              className="m-6 bg-gray-700 p-4 rounded-xl w-full max-w-md text-white text-center hover:text-blue-400 transition-colors flex justify-center items-center gap-4"
            >
              <WalletConnectIcon />
              WalletConnect
            </button>
          </div>
        )}

        <div className="w-4 h-80 bg-gray-600 lg:block hidden" />

        {user ? (
          <div className="flex flex-col items-center w-full">
            <h1 className="font-bold">Discord Connected</h1>
            <div className="flex flex-col gap-4 sm:w-full sm:flex-row justify-between m-6 bg-gray-700 p-4 rounded-xl max-w-md">
              <div className="flex gap-8">
                <div className="relative h-20 w-20 rounded-full overflow-hidden ring-4 ring-indigo-500">
                  <Image
                    src={
                      user.avatar
                        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
                        : `https://cdn.discordapp.com/embed/avatars/${randomIntFromInterval(
                            0,
                            4
                          )}.png`
                    }
                    alt={`${user.username} #${user.discriminator}`}
                    layout="fill"
                  />
                </div>
                <div>
                  <h1 className="text-white">{user.username}</h1>
                  <h2 className="text-gray-400">#{user.discriminator}</h2>
                </div>
              </div>
              <div className="flex justify-center items-center">
                <button
                  className="bg-red-600 text-white p-2 w-32 rounded hover:bg-red-700 transition-colors"
                  onClick={handleLogoutClick}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col justify-center items-center">
            <h1 className="font-bold">Discord not connected</h1>
            <p className="text-sm text-gray-500 px-6 text-center">
              Connecting discord is required if you want to integrate role for
              NFT holders from your project
            </p>
            <Link href={DISCORD_AUTH_URL} passHref>
              <a className="m-6 bg-[#5B65E9] p-4 rounded-xl w-full max-w-md text-white text-center hover:bg-[#464fcb] transition-colors flex gap-3 justify-center items-center">
                <DiscordIcon />
                Connect with Discord
              </a>
            </Link>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-4 justify-center items-center text-3xl my-10">
        <button
          className="bg-blue-600 text-white p-6 rounded hover:bg-blue-700 transition-colors disabled:text-gray-500 disabled:bg-blue-400"
          onClick={handleSignClick}
          disabled={!account || account === cookieAddress}
        >
          {!account
            ? "Connect Wallet to continue"
            : account === cookieAddress
            ? "Signed"
            : "Sign Wallet"}
        </button>

        {!!account && account !== cookieAddress && (
          <span className="text-sm">
            Sign required to enter dashboard with {shortenIfAddress(account)}{" "}
            account
          </span>
        )}
        {!account && (
          <span className="text-sm">
            Please connect wallet to continue to dashboard
          </span>
        )}
        {account === cookieAddress && (
          <span className="text-sm">
            Already signed with {shortenIfAddress(account)}, you can enter
            dashboard now
          </span>
        )}
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const cookie = getHttpCookie(context.req, context.res);
  try {
    const msg = cookie.get("auth_page_message");
    cookie.set("auth_page_message", "", { expires: new Date(0) });
    const user = await getLoggedInDiscordUser(context.req).catch(() => null);
    let cookieAddress: string | null;
    try {
      cookieAddress = getCookieWallet(cookie);
    } catch (error) {
      cookieAddress = null;
    }
    return {
      props: {
        user,
        cookieAddress,
        msg: msg || null,
      },
    };
  } catch (error) {
    return { props: {}, redirect: { destination: "/500" } };
  }
};

export default AuthenticatePage;
