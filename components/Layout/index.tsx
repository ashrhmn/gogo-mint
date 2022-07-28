import React from "react";
import LayoutDashboard from "./LayoutDashboard";
import LayoutMint from "./LayoutMint";

const Layout = ({
  children,
  dashboard = false,
  mint = false,
}: {
  children: React.ReactNode;
  mint?: boolean;
  dashboard?: boolean;
}) => {
  if (dashboard) return <LayoutDashboard>{children}</LayoutDashboard>;
  if (mint) return <LayoutMint>{children}</LayoutMint>;
  return <>{children}</>;
};

export default Layout;
