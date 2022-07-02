import React from "react";

const LayoutMain = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <nav></nav>
      <main className="max-w-7xl mx-auto">{children}</main>
    </>
  );
};

export default LayoutMain;
