import { Project } from "@prisma/client";
import { shortenIfAddress } from "@usedapp/core";
import { GetServerSideProps, NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import ClaimsSection from "../../components/ProjectDashboard/Claims";
import OverviewSection from "../../components/ProjectDashboard/Overview";
import PermissionsSection from "../../components/ProjectDashboard/Permissions";
import SettingsSection from "../../components/ProjectDashboard/Settings";
import { getUserByAccessToken } from "../../services/discord.service";
import { getProjectByChainAddress } from "../../services/project.service";
import { getUserByDiscordIdentifiers } from "../../services/user.service";
import { getAccessTokenFromCookie, getHttpCookie } from "../../utils/Request";

interface Props {
  project: Project;
}

const ProjectPage: NextPage<Props> = ({ project }) => {
  const router = useRouter();
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
      <div className="flex justify-between">
        <div>
          <h1 className="text-5xl font-bold">{project.name}</h1>
          <h2 className="text-2xl font-medium">
            {shortenIfAddress(project.address)}
          </h2>
        </div>
        <div>
          <button>Create NFT</button>
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
  const dbUser = await getUserByDiscordIdentifiers(
    user.username,
    user.discriminator
  );
  if (!dbUser) {
    cookie.set("auth_page_message", "You must login to continue");
    return { props: {}, redirect: { destination: "/authenticate" } };
  }
  const project = await getProjectByChainAddress(contract, +network);
  if (!project) return { props: {}, redirect: { destination: `/404` } };
  if (project.userId !== dbUser.id) {
    cookie.set(
      "auth_page_message",
      "You are not allowed to view this page. Are you logged in to the correct user?"
    );
    return { props: {}, redirect: { destination: "/authenticate" } };
  }
  return { props: { project } };
};

export default ProjectPage;
