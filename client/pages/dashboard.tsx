import { Project } from "@prisma/client";
import { GetServerSideProps, NextApiRequest, NextPage } from "next";
import React from "react";
import { getUserByAccessToken } from "../services/discord.service";
import { getAllProjectsByDiscordId } from "../services/project.service";
import { getAccessTokenFromCookie } from "../utils/Request";

interface Props {
  projects: Project[] | null;
}

const Dashboard: NextPage<Props> = ({ projects }) => {
  console.log(projects);
  return <div>Dashboard</div>;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const accessToken = getAccessTokenFromCookie(context.req as NextApiRequest);
  if (!accessToken) return { props: { projects: null } };
  const user = await getUserByAccessToken(accessToken);
  if (!user) return { props: { projects: null } };
  const projects = await getAllProjectsByDiscordId(
    user.username,
    user.discriminator
  );
  return { props: { projects } };
};

export default Dashboard;
