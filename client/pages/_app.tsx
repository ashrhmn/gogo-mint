import "../styles/globals.css";
import type { AppProps } from "next/app";
import {
  DAppProvider,
  DAppProviderProps,
  Mainnet,
  Rinkeby,
} from "@usedapp/core";
import { RPC_URLS } from "../constants/RPC_URL";
import LayoutMain from "../components/Laouts/LayoutMain";

function MyApp({ Component, pageProps }: AppProps) {
  const config: DAppProviderProps["config"] = {
    readOnlyUrls: RPC_URLS,
  };
  return (
    <DAppProvider config={config}>
      <LayoutMain>
        <Component {...pageProps} />
      </LayoutMain>
    </DAppProvider>
  );
}

export default MyApp;
