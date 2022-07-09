import { Project } from "@prisma/client";
import { GetServerSideProps, NextPage } from "next";
import React from "react";
import { getProjectByUid } from "../../services/project.service";

interface Props {
  project: Project;
}

const MintPage: NextPage<Props> = ({ project }) => {
  return <div></div>;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const uid = context.query.uid;
  if (!uid || typeof uid !== "string")
    return { props: {}, redirect: { destination: "/404" } };
  const project = await getProjectByUid(uid);
  if (!project) return { props: {}, redirect: { destination: "/404" } };
  return { props: { project } };
};

export default MintPage;
