export const RPC_URLS: { [chainId: number]: string } = {
  1: `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}` as string,
  3: `https://ropsten.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}` as string,
  4: `https://rinkeby.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}` as string,
  5: `https://goerli.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}` as string,
  42: `https://kovan.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}` as string,
  43114: `https://api.avax.network/ext/bc/C/rpc`,
};
