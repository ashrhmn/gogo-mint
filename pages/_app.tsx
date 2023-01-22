import "../styles/globals.css";
import "../styles/globals.scss";
import type { AppProps } from "next/app";
import { DAppProvider, DAppProviderProps } from "@usedapp/core";
// import { RPC_URLS } from "../constants/RPC_URL";
import Head from "next/head";
import { Toaster } from "react-hot-toast";

function MyApp({ Component, pageProps }: AppProps) {
  const config: DAppProviderProps["config"] = {
    // readOnlyUrls: RPC_URLS,
  };
  return (
    <DAppProvider config={config}>
      <Head>
        <title>HydroMint</title>
      </Head>
      <Component {...pageProps} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#363636",
            color: "#fff",
          },
        }}
      />
    </DAppProvider>
  );
}

export default MyApp;
