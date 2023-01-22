import { Project } from "@prisma/client";
import { shortenIfAddress, useEthers } from "@usedapp/core";
import { GetServerSideProps, NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import CopyAddressToClipboard from "../../components/Common/CopyAddressToClipboard";
import Layout from "../../components/Layout";
import { service } from "../../service";
import { getCookieWallet } from "../../services/auth.service";

import { getAllProjectByOwnerAddress } from "../../services/project.service";
import { getUserByWalletAddress } from "../../services/user.service";
import { errorHasMessage } from "../../utils/Error.utils";
import { getHttpCookie } from "../../utils/Request.utils";
import { authPageUrlWithMessage } from "../../utils/Response.utils";

interface Props {
  projects: Project[] | null;
  cookieAddress: string;
}

const Dashboard: NextPage<Props> = ({
  projects: initialProjects,
  cookieAddress,
}) => {
  const [projects, setProjects] = useState(initialProjects);
  const router = useRouter();
  const { account } = useEthers();
  useEffect(() => {
    if (account && account !== cookieAddress)
      router.push(
        authPageUrlWithMessage(
          `Signed in wallet is ${shortenIfAddress(
            cookieAddress
          )}, but connected wallet is ${shortenIfAddress(
            account
          )}. Please Sign with current wallet`
        )
      );
  }, [account, cookieAddress, router]);

  const handleDeleteProject = async (id: number) => {
    await service
      .delete(`/projects/${id}`)
      .then((res) => res.data)
      .then(console.log)
      .then(() => {
        toast.success(
          "Project will be deleted shortly (May take time depending on the number of Artworks)"
        );
        setProjects((p) => (!!p ? p.filter((d) => d.id !== id) : p));
      })
      .catch(() => {
        toast.error("Error deleting project");
      });
  };
  return (
    <Layout dashboard>
      <div className="flex justify-between my-4 items-center">
        <h1 className="text-4xl font-medium">Your Projects</h1>
        <Link href={"/dashboard/new-project"} passHref>
          <a className="bg-sky-600 text-white rounded w-40 p-2 text-xl text-center">
            New Project
          </a>
        </Link>
      </div>
      {!projects && (
        <div className="text-center text-3xl mt-20">Error Loading Projects</div>
      )}
      {projects && projects.length > 0 && (
        <div className="w-full overflow-x-auto">
          <div className="w-full min-w-[800px] border-2 border-gray-400 rounded text-xl">
            <div className="flex justify-between text-center font-bold border-gray-400 border-b-2 py-3 mb-3">
              <h1 className="w-4/12">Name</h1>
              <h1 className="w-2/12">Type</h1>
              <h1 className="w-1/12">Network</h1>
              <h1 className="w-3/12">Address</h1>
              <h1 className="w-2/12">Actions</h1>
            </div>
            {projects &&
              projects.map((p) => (
                <div
                  className="flex justify-between items-center text-center hover:bg-gray-700 transition-colors"
                  key={p.id}
                >
                  <Link
                    href={`/dashboard/project?contract=${p.address}&network=${p.chainId}`}
                    passHref
                  >
                    <a className="w-4/12 py-3">{p.name}</a>
                  </Link>
                  <Link
                    href={`/dashboard/project?contract=${p.address}&network=${p.chainId}`}
                    passHref
                  >
                    <a className="w-2/12 py-3">{p.collectionType}</a>
                  </Link>
                  <Link
                    href={`/dashboard/project?contract=${p.address}&network=${p.chainId}`}
                    passHref
                  >
                    <a className="w-1/12 py-3">{p.chainId}</a>
                  </Link>
                  <h1 className="w-3/12">
                    <CopyAddressToClipboard shorten address={p.address || ""} />
                  </h1>
                  <h1 className="w-2/12">
                    <button
                      onClick={() => handleDeleteProject(p.id)}
                      className="text-red-700 hover:text-white hover:bg-red-500 transition-colors py-1 px-3 rounded"
                    >
                      Delete
                    </button>
                  </h1>
                </div>
              ))}
          </div>
        </div>
      )}
      {projects && projects.length === 0 && (
        <div className="text-center text-3xl mt-20">
          <span>No project to show. </span>
          <Link href={`/dashboard/new-project`} passHref>
            <span className="underline cursor-pointer hover:text-blue-600 transition-colors font-medium">
              Create One?
            </span>
          </Link>
        </div>
      )}
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const cookie = getHttpCookie(context.req, context.res);
  try {
    let cookieAddress: string | null;
    try {
      cookieAddress = getCookieWallet(cookie);
    } catch (error) {
      cookieAddress = null;
    }
    if (!cookieAddress)
      return {
        props: {},
        redirect: { destination: authPageUrlWithMessage("Sign Required") },
      };
    const dbUser = await getUserByWalletAddress(cookieAddress);
    if (!dbUser)
      return {
        props: {},
        redirect: { destination: authPageUrlWithMessage("Sign Required") },
      };
    const projects = await getAllProjectByOwnerAddress(cookieAddress);
    return { props: { projects, cookieAddress } };
  } catch (error) {
    console.log(error);
    return {
      props: {},
      redirect: {
        destination: authPageUrlWithMessage(
          typeof error === "string"
            ? error
            : errorHasMessage(error)
            ? error.message
            : "Error authenticating user"
        ),
      },
    };
  }
};

export default Dashboard;
