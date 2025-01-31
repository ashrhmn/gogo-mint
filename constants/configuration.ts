export const DEFAULT_CHAIN = { id: 4, name: "Rinkeby" };

export const ACCESS_TOKEN_COOKIE_KEY = "Nqr#3FEd6uY}]aP";

export const WALLET_ADDRESS_COOKIE_KEY =
  "9DHKJXsRcSuK46vTy2AWtFptMdmNwtvyzyKL4G";

export const WALLET_SIGN_COOKIE_KEY =
  "Y6PKU6SKTAzT4NR67GdQSsy6PKxJ6k8KQprY7H7m";

export const IS_DISCLAIMER_SHOWN_KEY = "4yK79gwV4UkbUgVyX8N4PN5Y";

export const ENV_PROTOCOL =
  process.env.NODE_ENV === "production" ? "https" : "http";

export const CRYPTO_SECRET =
  process.env.CRYPTO_SECRET ||
  "FNmag3vLrqKng4tP2LdnmsEDffPfxHygjH9DC6N9AhL7RgcfPjeWyzGcgnWL";

export const DISCORD_OAUTH_CLIENT_ID =
  process.env.DISCORD_OAUTH_CLIENT_ID || "892427349927280732";

export const DISCORD_OAUTH_CLIENT_SECRET =
  process.env.DISCORD_OAUTH_CLIENT_SECRET || "zKxjMkC-GmD8J0gvrZm3yKSEqnBS8LhE";

export const isDevelopment = process.env.NODE_ENV !== "production";

export const DISCORD_AUTH_URL = isDevelopment
  ? `https://discord.com/oauth2/authorize?client_id=992820231242268723&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fv1%2Fauth%2Fdiscord%2Fredirect&response_type=code&scope=identify`
  : `https://discord.com/api/oauth2/authorize?client_id=992820231242268723&redirect_uri=https%3A%2F%2F${
      process.env.NEXT_PUBLIC_HOST_ROOT || "hydromint.xyz"
    }%2Fapi%2Fv1%2Fauth%2Fdiscord%2Fredirect&response_type=code&scope=identify`;

export const DISCORD_AUTH_URL_BUYER = isDevelopment
  ? `https://discord.com/api/oauth2/authorize?client_id=992820231242268723&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fv1%2Fauth%2Fdiscord%2Fredirect-buyer&response_type=code&scope=identify`
  : `https://discord.com/api/oauth2/authorize?client_id=992820231242268723&redirect_uri=https%3A%2F%2F${
      process.env.NEXT_PUBLIC_HOST_ROOT || "hydromint.xyz"
    }%2Fapi%2Fv1%2Fauth%2Fdiscord%2Fredirect-buyer&response_type=code&scope=identify`;

export const getMessageToSignOnAuth = (address: string) => `
Welcome to HydroMint

Account : ${address}
`;

export const getMessageToSignOnTokenGatedMint = (
  address: string,
  mintCount: number
) => `Minting ${mintCount} NFT(s) for ${address}`;

export const EMPTY_WHITELIST_ROOT =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const PLATFORM_SIGNER_PRIVATE_KEY =
  process.env.PLATFORM_SIGNER_PRIVATE_KEY ||
  "61f61b813c9d591825c7385e6fd3bb37687cc9c3b93f293b359cec8c98a8ee91";

export const PUBLIC_HOST_ROOT =
  process.env.NEXT_PUBLIC_HOST_ROOT || "hydromint.xyz";

export const PUBLIC_URL = `${
  isDevelopment ? "http" : "https"
}://${PUBLIC_HOST_ROOT}/`;

export const BASE_API_URL = `${
  isDevelopment ? "http" : "https"
}://${PUBLIC_HOST_ROOT}/api/v1/`;

export const BASE_URI =
  process.env.BASE_URI || "http://54.153.49.223:3001/api/v1/";

export const CONTRACT_INTERFACE_ID = {
  ERC_721_INTERFACE_ID: "0x80ac58cd",
  ERC_1155_INTERFACE_ID: "0xd9b67a26",
};

export const SUPPORTS_INTERFACE_ABI = [
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];
