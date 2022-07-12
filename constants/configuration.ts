export const DEFAULT_CHAIN = { id: 4, name: "Rinkeby" };

export const ACCESS_TOKEN_COOKIE_KEY = "Nqr#3FEd6uY}]aP";

export const WALLET_ADDRESS_COOKIE_KEY =
  "9DHKJXsRcSuK46vTy2AWtFptMdmNwtvyzyKL4G";

export const WALLET_SIGN_COOKIE_KEY =
  "Y6PKU6SKTAzT4NR67GdQSsy6PKxJ6k8KQprY7H7m";

export const ENV_PROTOCOL =
  process.env.NODE_ENV === "production" ? "https" : "http";

export const CRYPTO_SECRET =
  process.env.CRYPTO_SECRET ||
  "FNmag3vLrqKng4tP2LdnmsEDffPfxHygjH9DC6N9AhL7RgcfPjeWyzGcgnWL";

export const DISCORD_OAUTH_CLIENT_ID =
  process.env.DISCORD_OAUTH_CLIENT_ID || "892427349927280732";

export const DISCORD_OAUTH_CLIENT_SECRET =
  process.env.DISCORD_OAUTH_CLIENT_SECRET || "zKxjMkC-GmD8J0gvrZm3yKSEqnBS8LhE";

export const isDevelopment = process.env.NODE_ENV != "production";

export const DISCORD_AUTH_URL = isDevelopment
  ? `https://discord.com/oauth2/authorize?client_id=992820231242268723&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fv1%2Fauth%2Fdiscord%2Fredirect&response_type=code&scope=identify`
  : `https://discord.com/api/oauth2/authorize?client_id=992820231242268723&redirect_uri=https%3A%2F%2F${
      process.env.NEXT_PUBLIC_HOST_ROOT || "gogo-mint.ashrhmn.com"
    }%2Fapi%2Fv1%2Fauth%2Fdiscord%2Fredirect&response_type=code&scope=identify`;

export const getMessageToSignOnAuth = (address: string) => `
Welcome to GOGO-MINT

Account : ${address}
`;
