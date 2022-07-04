import { Project } from "@prisma/client";
import { shortenIfAddress } from "@usedapp/core";
import { GetServerSideProps, NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useState } from "react";
import ClaimsSection from "../../../components/ProjectDashboard/Claims";
import CreateModal from "../../../components/ProjectDashboard/CreateModal";
import OverviewSection from "../../../components/ProjectDashboard/Overview";
import PermissionsSection from "../../../components/ProjectDashboard/Permissions";
import SettingsSection from "../../../components/ProjectDashboard/Settings";
import { authorizeProject } from "../../../services/auth.service";

interface Props {
  project: Project;
}

const ProjectPage: NextPage<Props> = ({ project }) => {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const setTab = (val: string) => {
    const r = router;
    r.query.tab = val;
    router.push(r);
  };
  const currentTab =
    typeof router.query.tab == "string" &&
    ["permissions", "claims", "settings"].includes(router.query.tab)
      ? router.query.tab
      : "overview";
  return (
    <div>
      <div className="flex justify-between my-4">
        <div>
          <h1 className="text-5xl font-bold">{project.name}</h1>
          <h2 className="text-2xl font-medium">
            {shortenIfAddress(project.address)}
          </h2>
        </div>
        <div>
          <button onClick={() => setIsCreateModalOpen(true)}>+ Create</button>
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
              currentTab == "permissions"
                ? "text-indigo-600 border-b-2 border-indigo-600 font-medium"
                : ""
            }`}
            onClick={() => setTab("permissions")}
          >
            Permissions
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
        <div>{currentTab == "overview" && <OverviewSection />}</div>
        <div>{currentTab == "permissions" && <PermissionsSection />}</div>
        <div>{currentTab == "claims" && <ClaimsSection />}</div>
        <div>{currentTab == "settings" && <SettingsSection />}</div>
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
