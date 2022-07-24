import { shortenIfAddress, useEthers } from "@usedapp/core";
import { isAddress } from "ethers/lib/utils";
import { GetServerSideProps, NextPage } from "next";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import BatchCreateModal from "../../components/ProjectDashboard/BatchCreateModal";
import ClaimsSection from "../../components/ProjectDashboard/Claims";
import CreateModal from "../../components/ProjectDashboard/CreateModal";
import OverviewSection from "../../components/ProjectDashboard/Overview";
import PermissionsSection from "../../components/ProjectDashboard/Permissions";
import SettingsSection from "../../components/ProjectDashboard/Settings";
import { getCookieWallet } from "../../services/auth.service";
import {
  getClaimedSupplyCountByProjectChainAddress,
  getProjectByChainAddress,
  getUnclaimedSupplyCountByProjectChainAddress,
} from "../../services/project.service";
import { getUserByWalletAddress } from "../../services/user.service";
import { ProjectExtended } from "../../types";
import { getHttpCookie } from "../../utils/Request.utils";
import { authPageUrlWithMessage } from "../../utils/Response.utils";

interface Props {
  project: ProjectExtended & { _count: { nfts: number } };
  cookieAddress: string;
  unclaimedSupply: number;
  claimedSupply: number;
  page: number;
  view: number;
}

const ProjectPage: NextPage<Props> = ({
  project,
  cookieAddress,
  claimedSupply,
  unclaimedSupply,
  page,
  view,
}) => {
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBatchCreateModalOpen, setIsBatchCreateModalOpen] = useState(false);
  const setTab = (tab: string) =>
    router.push({ ...router, query: { ...router.query, tab } });
  const currentTab =
    typeof router.query.tab == "string" &&
    ["permissions", "claims", "settings"].includes(router.query.tab)
      ? router.query.tab
      : "overview";
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between my-4">
        <div className="flex gap-4">
          {project.imageUrl && (
            <div className="h-20 w-20 relative hidden sm:block">
              <Image src={project.imageUrl} alt={""} layout="fill" />
            </div>
          )}
          <div>
            <h1 className="text-4xl font-bold">{project.name}</h1>
            <h2 className="text-2xl font-medium">
              {shortenIfAddress(project.address)}
            </h2>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <button
            className="bg-sky-600 text-white p-2 w-40 rounded hover:bg-sky-700 transition-colors"
            onClick={() => setIsCreateModalOpen(true)}
          >
            + Create
          </button>
          <button
            className="bg-sky-600 text-white p-2 w-40 rounded hover:bg-sky-700 transition-colors"
            onClick={() => setIsBatchCreateModalOpen(true)}
          >
            + Create Batch
          </button>
        </div>
      </div>
      <div>
        <div className="flex justify-start gap-10 px-8 overflow-x-auto border-b-2 border-gray-600">
          <button
            className={`${
              currentTab == "overview"
                ? "text-indigo-600 border-b-2 border-indigo-600 font-medium"
                : ""
            }`}
            onClick={() => setTab("overview")}
          >
            Overview
          </button>
          <button
            className={`${
              currentTab == "claims"
                ? "text-indigo-600 border-b-2 border-indigo-600 font-medium"
                : ""
            }`}
            onClick={() => setTab("claims")}
          >
            Claim Phases
          </button>
          <button
            className={`${
              currentTab == "settings"
                ? "text-indigo-600 border-b-2 border-indigo-600 font-medium"
                : ""
            }`}
            onClick={() => setTab("settings")}
          >
            Settings
          </button>
        </div>
        <div>
          {currentTab == "overview" && (
            <OverviewSection
              address={project.address}
              projectChainId={project.chainId}
              nfts={project.nfts}
              collectionType={project.collectionType}
              ownerAddress={project.owner.walletAddress}
              nftCount={project._count.nfts}
              claimedSupply={claimedSupply}
              unclaimedSupply={unclaimedSupply}
              page={page}
              view={view}
            />
          )}
        </div>
        <div>
          {currentTab == "permissions" && (
            <PermissionsSection
              projectAddress={project.address}
              projectChainId={project.chainId}
            />
          )}
        </div>
        <div>
          {currentTab == "claims" && (
            <ClaimsSection
              projectId={project.id}
              projectAddress={project.address}
              projectChainId={project.chainId}
              collectionType={project.collectionType}
              projectOwner={project.owner.walletAddress}
            />
          )}
        </div>
        <div>
          {currentTab == "settings" && (
            <SettingsSection
              projectId={project.id}
              projectAddress={project.address}
              projectChainId={project.chainId}
              collectionType={project.collectionType}
            />
          )}
        </div>
      </div>
      <div
        onClick={() => {
          setIsCreateModalOpen(false);
          setIsBatchCreateModalOpen(false);
        }}
        className={`${
          isCreateModalOpen || isBatchCreateModalOpen
            ? ""
            : "opacity-0 translate-x-full"
        } fixed inset-0 z-50 bg-[rgba(0,0,0,0.5)] transition-opacity`}
      />
      <CreateModal
        isCreateModalOpen={isCreateModalOpen}
        setIsCreateModalOpen={setIsCreateModalOpen}
        projectId={project.id}
        ownerAddress={project.owner.walletAddress}
      />
      <BatchCreateModal
        isBatchCreateModalOpen={isBatchCreateModalOpen}
        ownerAddress={project.owner.walletAddress}
        projectId={project.id}
        setIsBatchCreateModalOpen={setIsBatchCreateModalOpen}
      />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const cookies = getHttpCookie(context.req, context.res);
  try {
    const { contract, network } = context.query;
    if (
      !contract ||
      !network ||
      typeof contract != "string" ||
      typeof network != "string" ||
      !isAddress(contract) ||
      isNaN(+network)
    )
      return { props: {}, redirect: { destination: `/404` } };
    const cookieAddress = getCookieWallet(cookies);
    const dbUser = await getUserByWalletAddress(cookieAddress);
    if (!dbUser)
      return {
        props: {},
        redirect: { destination: authPageUrlWithMessage("Sign Required") },
      };
    const { page, view } = context.query;
    const pageNo = typeof page === "string" && !isNaN(+page) ? +page : 1;
    const take =
      typeof view === "string" && !isNaN(+view)
        ? +view > 100
          ? 100
          : +view
        : 10;
    const skip = (pageNo - 1) * take;

    const project = await getProjectByChainAddress(
      contract,
      +network,
      skip,
      take
    );
    if (!project) return { props: {}, redirect: { destination: `/404` } };
    if (project.owner.walletAddress !== cookieAddress)
      return {
        props: {},
        redirect: {
          destination: authPageUrlWithMessage(
            "You are not owner of this project, are you logged in with the correct account/wallet?"
          ),
        },
      };

    const [claimedSupply, unclaimedSupply] = await Promise.all([
      getClaimedSupplyCountByProjectChainAddress(contract, +network),
      getUnclaimedSupplyCountByProjectChainAddress(contract, +network),
    ]);

    return {
      props: {
        project,
        cookieAddress,
        claimedSupply,
        unclaimedSupply,
        page: pageNo,
        view: take,
      },
    };
  } catch (error) {
    cookies.set(
      "auth_page_message",
      (error as any).message && typeof (error as any).message === "string"
        ? (error as any).message
        : "Error authenticating user"
    );
    return { props: {}, redirect: { destination: "/authenticate" } };
  }
};

export default ProjectPage;
