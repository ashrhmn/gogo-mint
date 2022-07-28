import { NextPage } from "next";
import React from "react";
import Layout from "../components/Layout";

const ErrorPage: NextPage = () => {
  return (
    <Layout mint>
      <div className="flex justify-center flex-col items-center h-[80vh] text-4xl font-medium">
        <h1>The requested page can not be found</h1>
        <h2 className="text-xl text-gray-600">Error 404</h2>
      </div>
    </Layout>
  );
};

export default ErrorPage;
