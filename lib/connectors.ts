import { WalletConnectConnector } from "@web3-react/walletconnect-connector";
import { RPC_URLS } from "../constants/RPC_URL";

export const walletConnectConnector = new WalletConnectConnector({
  rpc: RPC_URLS,
  qrcode: true,
});
