import { NFT, NFTMetadataProperties, Project } from "@prisma/client";
import { shortenIfAddress } from "@usedapp/core";
import { GetServerSideProps, NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useState } from "react";
import ClaimsSection from "../../components/ProjectDashboard/Claims";
import CreateModal from "../../components/ProjectDashboard/CreateModal";
import OverviewSection from "../../components/ProjectDashboard/Overview";
import PermissionsSection from "../../components/ProjectDashboard/Permissions";
import SettingsSection from "../../components/ProjectDashboard/Settings";
import { ENV_PROTOCOL } from "../../constants/configuration";
import { authorizeProject } from "../../services/auth.service";
import { ProjectExtended } from "../../types";

interface Props {
  project: ProjectExtended;
}

const ProjectPage: NextPage<Props> = ({ project }) => {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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
        <div>
          <button
            className="bg-sky-600 text-white p-2 w-40 rounded hover:bg-sky-700 transition-colors"
            onClick={() => setIsCreateModalOpen(true)}
          >
            + Create
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
          {/* <button
            className={`${
              currentTab == "permissions"
                ? "text-indigo-600 border-b-2 border-indigo-600 font-medium"
                : ""
            }`}
            onClick={() => setTab("permissions")}
          >
            Permissions
          </button> */}
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
        <div>{currentTab == "claims" && <ClaimsSection />}</div>
        <div>
          {currentTab == "settings" && (
            <SettingsSection
              projectId={project.id}
              projectAddress={project.address}
              projectChainId={project.chainId}
              collectionype={project.collectionType}
              whitelist={project.whitelist}
            />
          )}
        </div>
      </div>
      <div
        onClick={() => setIsCreateModalOpen(false)}
        className={`${
          isCreateModalOpen ? "" : "opacity-0 translate-x-full"
        } fixed inset-0 z-50 bg-[rgba(0,0,0,0.5)] transition-opacity`}
      />
      <CreateModal
        isCreateModalOpen={isCreateModalOpen}
        setIsCreateModalOpen={setIsCreateModalOpen}
        projectId={project.id}
      />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { contract, network } = context.query;

  if (
    !contract ||
    !network ||
    typeof contract != "string" ||
    typeof network != "string"
  )
    return { props: {}, redirect: { destination: `/404` } };
  const project = await authorizeProject(context, contract, +network);
  if (!!(project as any).redirect) {
    return {
      props: (project as any).props,
      redirect: (project as any).redirect,
    };
  }

  return { props: { project } };
};

export default ProjectPage;
