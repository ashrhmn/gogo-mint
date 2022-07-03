import { NextPage } from "next";
import React from "react";

const ErrorPage: NextPage = () => {
  return (
    <div className="flex justify-center flex-col items-center h-[80vh] text-4xl font-medium">
      <h1>The requested page can not be found</h1>
      <h2 className="text-xl text-gray-600">Error 404</h2>
    </div>
  );
};

export default ErrorPage;
