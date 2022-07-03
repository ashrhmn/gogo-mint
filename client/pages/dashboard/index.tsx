import { Project } from "@prisma/client";
import { GetServerSideProps, NextApiRequest, NextPage } from "next";
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
  console.log(projects);
  return (
    <div>
      <button onClick={() => router.push(`/dashboard/new-project`)}>
        New Project
      </button>
      <h1>Projects</h1>
      <div>{!projects && <>Error Loading Projects</>}</div>
      <div>
        {projects && projects.map((p) => <div key={p.id}>{p.name}</div>)}
      </div>
      <div>{projects && projects.length == 0 && <>No project to show</>}</div>
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
