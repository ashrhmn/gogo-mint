import { Project } from "@prisma/client";
import { GetServerSideProps, NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import Layout from "../../components/Layout";
import { getProjectsWithValidUid } from "../../services/project.service";

interface Props {
  projects: Project[];
}

const MintHome: NextPage<Props> = ({ projects }) => {
  return (
    <Layout mint>
      <h1 className="text-3xl text-center font-bold">Mint Projects</h1>
      <div className="flex flex-wrap justify-center">
        {projects.map((p) => (
          <Link key={p.id} href={`/mint/${p.uid}`} passHref>
            <a className="text-2xl rounded w-96 group m-4">
              <div className="flex shadow bg-gray-700 group-hover:bg-gray-800 transition-colors rounded-xl gap-2 p-3">
                {!!p.imageUrl ? (
                  <div className="relative h-20 aspect-square rounded">
                    <Image
                      src={p.imageUrl}
                      alt=""
                      layout="fill"
                      objectFit="cover"
                    />
                  </div>
                ) : (
                  <div className="h-20 w-20 bg-gray-800 rounded" />
                )}
                <div>
                  <h1 className="font-medium group-hover:text-blue-400 transition">
                    {p.name + " "}
                    <span className="font-normal text-sm">
                      ({p.collectionType})
                    </span>
                  </h1>
                  <h2 className="text-sm">{p.description}</h2>
                </div>
              </div>
            </a>
          </Link>
        ))}
      </div>
    </Layout>
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
