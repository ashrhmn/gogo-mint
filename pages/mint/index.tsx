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
            <a className="text-2xl rounded w-96 group">
              <div className="flex bg-gray-100 group-hover:bg-gray-200 transition-colors rounded-xl gap-2 p-3 m-4">
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
                  <div className="h-20 w-20 bg-gray-300 rounded" />
                )}
                <div>
                  <h1 className="font-medium group-hover:underline group-hover:text-blue-900 transition">
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
