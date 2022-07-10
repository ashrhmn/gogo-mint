import { Project } from "@prisma/client";
import { GetServerSideProps, NextPage } from "next";
import Link from "next/link";
import React from "react";
import { getProjectsWithValidUid } from "../../services/project.service";

interface Props {
  projects: Project[];
}

const MintHome: NextPage<Props> = ({ projects }) => {
  return (
    <div>
      <h1 className="text-3xl text-center font-bold">Mint Projects</h1>
      {projects.map((p) => (
        <Link key={p.id} href={`/mint/${p.uid}`} passHref>
          <a className="text-2xl rounded hover:underline hover:text-blue-900 transition">
            {p.name}
          </a>
        </Link>
      ))}
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (_) => {
  try {
    const projects = await getProjectsWithValidUid();
    return { props: { projects } };
  } catch (error) {
    return { props: {}, redirect: { destination: "/500" } };
  }
};

export default MintHome;
