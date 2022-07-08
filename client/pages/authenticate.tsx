import { User } from "@prisma/client";
import { shortenIfAddress, useEthers } from "@usedapp/core";
import { GetServerSideProps, NextApiRequest, NextPage } from "next";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";
import { service } from "../service";
import { getLoggedInUser } from "../services/user.service";
import { DiscordUserResponse } from "../types";
import { randomIntFromInterval } from "../utils/Number.utils";
import Image from "next/image";
import Link from "next/link";
import { DISCORD_AUTH_URL } from "../constants/configuration";
import { getHttpCookie } from "../utils/Request.utils";
import toast from "react-hot-toast";

interface Props {
  user?: DiscordUserResponse;
  msg: string | null;
}

const AuthenticatePage: NextPage<Props> = ({ user, msg }) => {
  const { account, deactivate, activateBrowserWallet } = useEthers();
  const [connectedUser, setConnectedUser] = useState<User | null>();
  const [connectedWallet, setConnectedWallet] = useState<string | null>("");
  const [bgProcesses, setBgProcesses] = useState(0);
  const [refetcher, setRefetcher] = useState(false);
  const router = useRouter();
  useEffect(() => {
    let id: string | number | NodeJS.Timeout | undefined;
    if (msg) {
      id = setTimeout(() => {
        toast.error(msg, { id: "page_msg" });
      }, 1000);
      console.log(id);
    }
    if (id) return () => clearTimeout(id);
  }, [msg, router.query.msg]);

  useEffect(() => {
    if (user) {
      setBgProcesses((v) => v + 1);
      toast
        .promise(
          service.get(
            `/users?username=${user.username}&discriminator=${user.discriminator}`
          ),
          {
            error: "Error fetching discord user data",
            loading: "Fetching discord user data...",
            success: "Discord user data fetched successfully",
          },
          { id: "fetch_discord_data" }
        )
        .then(({ data: { data: user } }: { data: { data: User } }) => {
          // console.log(user);
          //   console.log("Fetched wallet : ", user.walletAddress);
          setBgProcesses((v) => v - 1);
          setConnectedWallet(user.walletAddress);
        })
        .catch((err) => {
          console.log(err);
          setConnectedWallet("");
          setBgProcesses((v) => v - 1);
        });
    }
  }, [user, refetcher]);
  const handleLogoutClick = async () => {
    await service.get("/auth/discord/logout");
    router.reload();
  };

  useEffect(() => {
    if (account) {
      setBgProcesses((v) => v + 1);
      toast
        .promise(
          service.get(`/users?address=${account}`),
          {
            error: "Error fetching wallet data",
            loading: "Fetching wallet data...",
            success: "Wallet data fetched successfully",
          },
          { id: "fetch_wallet_data" }
        )
        .then(
          ({
            data: { data: user, error },
          }: {
            data: { data: User; error: any };
          }) => {
            // console.log(error);
            // console.log("Fetched user : ", user);
            setBgProcesses((v) => v - 1);
            setConnectedUser(user);
          }
        )
        .catch((err) => {
          console.log(err);
          setBgProcesses((v) => v - 1);
          setConnectedUser(null);
        });
    }
  }, [account, refetcher]);
  const handleLinkAccountClick = async () => {
    if (!user || !account) {
      return;
    }
    setBgProcesses((v) => v + 1);
    const { data: response } = await toast.promise(
      service.post("/auth/discord/link", {
        username: user.username,
        discriminator: user.discriminator,
        address: account,
      }),
      {
        loading: "Linking account...",
        success: "Account linked successfully!",
        error: "Error linking account!",
      }
    );
    setRefetcher((v) => !v);
    setBgProcesses((v) => v - 1);
    if (!response.error) {
    } else {
      alert(response.error);
    }
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row text-3xl justify-center mt-10">
        {account ? (
          <div className="flex flex-col gap-6 items-center w-full">
            <h1>You are logged in as</h1>
            <div className="bg-gray-700 text-white p-8 rounded-xl flex flex-col sm:flex-row items-center gap-6 max-w-md sm:w-full">
              <h1>{shortenIfAddress(account)}</h1>
              <button
                className="bg-red-500 text-white rounded text-2xl p-2 w-40 hover:bg-red-700 transition-colors"
                onClick={deactivate}
              >
                Disconnect
              </button>
            </div>
            {!bgProcesses && (
              <>
                {connectedUser ? (
                  <div className="text-center">
                    Your wallet is linked to the user{" "}
                    {connectedUser.discordUsername} #
                    {connectedUser.discordDiscriminator}
                  </div>
                ) : (
                  <div className="text-center">
                    Your wallet is not linked to any discord account
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="w-full flex flex-col justify-center items-center">
            <h1>Wallet not connect</h1>
            <button
              className="m-6 bg-gray-700 p-4 rounded-xl w-full max-w-md text-white text-center hover:text-blue-400 transition-colors"
              onClick={activateBrowserWallet}
            >
              Connect
            </button>
          </div>
        )}

        <div className="w-4 h-80 bg-gray-600 lg:block hidden" />

        {user ? (
          <div className="flex flex-col items-center w-full">
            <h1>Logged in as</h1>
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
            {!bgProcesses && (
              <>
                {connectedWallet ? (
                  <div className="text-center">
                    Your Discord account is linked to the wallet{" "}
                    <strong>{shortenIfAddress(connectedWallet)}</strong>
                  </div>
                ) : (
                  <div className="text-center">
                    Your Discord account is not linked to any wallet
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="w-full flex flex-col justify-center items-center">
            <h1>Discord not connected</h1>
            <Link href={DISCORD_AUTH_URL} passHref>
              <a className="m-6 bg-gray-700 p-4 rounded-xl w-full max-w-md text-white text-center hover:text-blue-400 transition-colors">
                Login with Discord
              </a>
            </Link>
          </div>
        )}
      </div>
      <div className="flex justify-center text-3xl my-10">
        <button
          disabled={
            !!bgProcesses ||
            !account ||
            !user ||
            (account === connectedWallet &&
              !!connectedUser &&
              user.username === connectedUser.discordUsername &&
              +user.discriminator === connectedUser.discordDiscriminator)
          }
          onClick={handleLinkAccountClick}
          className="bg-blue-600 text-white p-6 rounded hover:bg-blue-700 transition-colors disabled:text-gray-400 disabled:bg-blue-500"
        >
          Link Discord and Wallet
        </button>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const cookie = getHttpCookie(context.req, context.res);
  const msg = cookie.get("auth_page_message");
  // console.log("Msg : ", msg);

  cookie.set("auth_page_message", "", { expires: new Date(0) });
  const response = await getLoggedInUser(context.req);
  return {
    props: {
      user: response.data,
      msg: msg ? msg : null,
    },
  };
};

export default AuthenticatePage;
