export const RPC_URLS: { [chainId: number]: string } = {
  1: `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}` as string,
  3: `https://ropsten.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}` as string,
  4: "https://eth-rinkeby.alchemyapi.io/v2/ih9-sO2b3BLVwkT4G1o2TVeDDuCTgQzw",
  5: `https://eth-goerli.g.alchemy.com/v2/ih9-sO2b3BLVwkT4G1o2TVeDDuCTgQzw` as string,
  42: `https://kovan.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}` as string,
  56: `https://bsc-dataseed.binance.org/`,
  43114: `https://api.avax.network/ext/bc/C/rpc`,
  97: `https://data-seed-prebsc-1-s1.binance.org:8545/`,
  80001: `https://matic-mumbai.chainstacklabs.com`,
  4002: `https://rpc.testnet.fantom.network`,
  43113: `https://api.avax-test.network/ext/bc/C/rpc`,
  137: `https://polygon-rpc.com`,
};
