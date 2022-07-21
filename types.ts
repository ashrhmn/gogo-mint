import { NFT, NFTMetadataProperties, Project, User } from "@prisma/client";
import { IncomingMessage, ServerResponse } from "http";
import { NextApiRequest, NextApiResponse } from "next";

export interface DiscordAccessTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
}

export interface DiscordUserResponse {
  id: string;
  username: string;
  avatar: string | null;
  avatar_decoration: null;
  discriminator: string;
  public_flags: number;
  flags: number;
  banner: null;
  banner_color: string;
  accent_color: number;
  locale: string;
  mfa_enabled: boolean;
}

export type NextOrIncomingMessage =
  | NextApiRequest
  | (IncomingMessage & { cookies: Partial<{ [key: string]: string }> });

export type NextOrServerResponse = NextApiResponse | ServerResponse;

export interface IDeployConfigSet {
  logo: File | null;
  name: string;
  symbol: string;
  description: string;
  feeToAddress: string;
  saleWaves: ISaleConfigInput[];
  uid: string;
}

export type ContractFile = {
  abi: string | readonly any[];
  devdoc: any;
  evm: {
    assembly: string;
    bytecode: {
      generatedSources: any[];
      object: string;
      opcodes: string;
      sourceMap: string;
    };
    deployesBytecode: {};
    gasEstimates: {};
    legacyAssembly: {};
    methodIdentifiers: {
      [identifier: string]: string;
    };
  };
  ewasm: any;
  metadata: string;
  storageLayout: {
    storage: any[];
    types: any;
  };
  userdoc: {
    kind: string;
    methods: {};
    version: number;
  };
};

export interface CompileError {
  component: string;
  formattedMessage: string;
  message: string;
  severity: "error" | "warning";
  type: "CompileError";
  sourceLocation: {
    end: number;
    file: string;
    start: number;
  };
}

export interface INftTrait {
  uuid: string;
  trait_type: string;
  value: string;
}

export interface INftMetadata {
  name: string;
  description: string;
  file: File | null;
  traits: INftTrait[];
  openSeaBgColor: string;
  openSeaExternalUrl: string;
}

export interface NftExtended extends NFT {
  properties: NFTMetadataProperties[];
}
export interface ProjectExtended extends Project {
  nfts: NftExtended[];
  owner: User;
}

export interface ISaleConfig {
  status: boolean;
  startTime: number;
  endTime: number;
}

export interface MintPageConfig {
  privateMintCharge: number;
  publicMintCharge: number;
  privateSaleConfig1: ISaleConfig | null;
  privateSaleConfig2: ISaleConfig | null;
  publicSaleConfig: ISaleConfig | null;
  maxMintInPrivate: number;
  maxMintInPublic: number;
}

export interface ISaleConfigSol {
  saleIdentifier: string;
  enabled: boolean;
  startTime: number;
  endTime: number;
  mintCharge: string;
  whitelistRoot: string;
  maxMintPerWallet: number;
  maxMintInSale: number;
}

export interface ISaleConfigInput {
  uuid: string;
  enabled: boolean;
  saleType: "private" | "public";
  startTime: number;
  endTime: number;
  mintCharge: number;
  whitelistAddresses: string[];
  maxMintPerWallet: number;
  maxMintInSale: number;
}
