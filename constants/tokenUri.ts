export const getTokenUri = (nftId: number) =>
  `https://${
    process.env.NEXT_PUBLIC_HOST_ROOT || "gogo-mint.ashrhmn.com"
  }/api/v1/tokenUri?item=${nftId}`;

export const getContractUri = (address: string) =>
  `https://${
    process.env.NEXT_PUBLIC_HOST_ROOT || "gogo-mint.ashrhmn.com"
  }/api/v1/contractUri?address=${address}`;
