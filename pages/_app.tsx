import "../styles/globals.css";
import type { AppProps } from "next/app";
import { DAppProvider, DAppProviderProps } from "@usedapp/core";
import { RPC_URLS } from "../constants/RPC_URL";
import Head from "next/head";
import { Toaster } from "react-hot-toast";

function MyApp({ Component, pageProps }: AppProps) {
  const config: DAppProviderProps["config"] = {
    // readOnlyUrls: RPC_URLS,
  };
  return (
    <DAppProvider config={config}>
      <Head>
        <title>GOGO-MINT</title>
        {/* <meta
          httpEquiv="Content-Security-Policy"
          content="upgrade-insecure-requests"
        ></meta> */}
      </Head>

      <Component {...pageProps} />

      <Toaster position="top-right" />
    </DAppProvider>
  );
}

export default MyApp;
