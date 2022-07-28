import { NextPage } from "next";
import React from "react";
import Layout from "../components/Layout";

const ServerErrorPage: NextPage = () => {
  return (
    <Layout mint>
      <div className="flex justify-center flex-col items-center h-[80vh] text-4xl font-medium">
        <h1>An error occured on the server</h1>
        <h2 className="text-xl text-gray-600">Error 500</h2>
      </div>
    </Layout>
  );
};

export default ServerErrorPage;
