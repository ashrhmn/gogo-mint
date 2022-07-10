export const getTokenUri = (nftId: number) =>
  `https://${
    process.env.NEXT_PUBLIC_HOST_ROOT || "gogo-mint.ashrhmn.com"
  }/api/v1/nft/tokenUri?item=${nftId}`;
