import { getNetwork } from "@ethersproject/networks";
import { Project } from "@prisma/client";
import { shortenIfAddress } from "@usedapp/core";
import { GetServerSideProps, NextApiRequest, NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { getUserByAccessToken } from "../../services/discord.service";
import { getAllProjectsByDiscordId } from "../../services/project.service";
import { getAccessTokenFromCookie, getHttpCookie } from "../../utils/Request";

interface Props {
  projects: Project[] | null;
}

const Dashboard: NextPage<Props> = ({ projects }) => {
  const router = useRouter();
  return (
    <div>
      <div className="flex justify-between my-4 items-center">
        <h1 className="text-4xl font-medium">Your Projects</h1>
        <button
          className="bg-sky-600 text-white rounded w-40 p-2 text-xl"
          onClick={() => router.push(`/dashboard/new-project`)}
        >
          New Project
        </button>
      </div>
      {!projects && (
        <div className="text-center text-3xl mt-20">Error Loading Projects</div>
      )}
      {projects && projects.length > 0 && (
        <div className="w-full overflow-x-auto border-2 border-gray-400 rounded">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-400">
                <th className="p-4 text-center min-w-[100px]">Name</th>
                <th className="p-4 text-center min-w-[100px]">
                  Collection Type
                </th>
                <th className="p-4 text-center min-w-[100px]">Network</th>
                <th className="p-4 text-center min-w-[100px]">
                  Contract Address
                </th>
                <th className="p-4 text-center min-w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects &&
                projects.map((p) => (
                  <Link
                    href={`/dashboard/project?contract=${p.address}&network=${p.chainId}`}
                    passHref
                    key={p.id}
                  >
                    <tr className="cursor-pointer hover:bg-gray-200 transition-colors">
                      <td className="p-4 text-center min-w-[100px]">
                        {p.name}
                      </td>
                      <td className="p-4 text-center min-w-[100px]">721</td>
                      <td className="p-4 text-center min-w-[100px]">
                        {p.chainId}
                      </td>
                      <td className="p-4 text-center min-w-[100px]">
                        {shortenIfAddress(p.address)}
                      </td>
                      <td className="p-4 text-center min-w-[100px] ">
                        <button>Delete</button>
                      </td>
                    </tr>
                  </Link>
                ))}
            </tbody>
          </table>
        </div>
      )}
      {projects && projects.length == 0 && (
        <div className="text-center text-3xl mt-20">
          <span>No project to show. </span>
          <Link href={`/dashboard/new-project`} passHref>
            <span className="underline cursor-pointer hover:text-blue-600 transition-colors font-medium">
              Create One?
            </span>
          </Link>
        </div>
      )}
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const accessToken = getAccessTokenFromCookie(context.req);
  const cookie = getHttpCookie(context.req, context.res);
  if (!accessToken) {
    cookie.set("auth_page_message", "You must login to continue");
    return { props: {}, redirect: { destination: "/authenticate" } };
  }
  const user = await getUserByAccessToken(accessToken);
  if (!user) {
    cookie.set("auth_page_message", "You must login to continue");
    return { props: {}, redirect: { destination: "/authenticate" } };
  }
  const projects = await getAllProjectsByDiscordId(
    user.username,
    user.discriminator
  );
  return { props: { projects } };
};

export default Dashboard;
