import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { DAppProvider, DAppProviderProps, Mainnet, Rinkeby } from '@usedapp/core'
import { RPC_URLS } from '../constants/RPC_URL'

function MyApp({ Component, pageProps }: AppProps) {
  const config: DAppProviderProps["config"] = {
    readOnlyUrls: RPC_URLS
  }
  return <DAppProvider config={config}>
    <Component {...pageProps} />
  </DAppProvider>
}

export default MyApp
