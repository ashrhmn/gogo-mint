export const getTokenUri = (nftId: number) =>
  `https://${
    process.env.HOST_ROOT || "gogo-mint.ashrhmn.com"
  }/api/v1/nft/tokenUri?item=${nftId}`;
