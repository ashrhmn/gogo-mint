/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "../../common";

export interface TestInterface extends utils.Interface {
  functions: {
    "configRoot()": FunctionFragment;
    "emptyRoot()": FunctionFragment;
    "strConfigBytes(bool,uint256,uint256,uint256,bytes32,uint256,uint256)": FunctionFragment;
    "verify(bytes32[],bytes32,bytes32)": FunctionFragment;
    "verifyConfig(bytes32[],bool,uint256,uint256,uint256,bytes32,uint256,uint256)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "configRoot"
      | "emptyRoot"
      | "strConfigBytes"
      | "verify"
      | "verifyConfig"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "configRoot",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "emptyRoot", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "strConfigBytes",
    values: [
      PromiseOrValue<boolean>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BytesLike>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BigNumberish>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "verify",
    values: [
      PromiseOrValue<BytesLike>[],
      PromiseOrValue<BytesLike>,
      PromiseOrValue<BytesLike>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "verifyConfig",
    values: [
      PromiseOrValue<BytesLike>[],
      PromiseOrValue<boolean>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BytesLike>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BigNumberish>
    ]
  ): string;

  decodeFunctionResult(functionFragment: "configRoot", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "emptyRoot", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "strConfigBytes",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "verify", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "verifyConfig",
    data: BytesLike
  ): Result;

  events: {};
}

export interface Test extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: TestInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    configRoot(overrides?: CallOverrides): Promise<[string]>;

    emptyRoot(overrides?: CallOverrides): Promise<[string]>;

    strConfigBytes(
      enabled: PromiseOrValue<boolean>,
      startTime: PromiseOrValue<BigNumberish>,
      endTime: PromiseOrValue<BigNumberish>,
      mintCharge: PromiseOrValue<BigNumberish>,
      whitelistRoot: PromiseOrValue<BytesLike>,
      maxMintPerWallet: PromiseOrValue<BigNumberish>,
      maxMintInSale: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[string]>;

    verify(
      proof: PromiseOrValue<BytesLike>[],
      root: PromiseOrValue<BytesLike>,
      leaf: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<[void]>;

    verifyConfig(
      proof: PromiseOrValue<BytesLike>[],
      enabled: PromiseOrValue<boolean>,
      startTime: PromiseOrValue<BigNumberish>,
      endTime: PromiseOrValue<BigNumberish>,
      mintCharge: PromiseOrValue<BigNumberish>,
      whitelistRoot: PromiseOrValue<BytesLike>,
      maxMintPerWallet: PromiseOrValue<BigNumberish>,
      maxMintInSale: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[boolean]>;
  };

  configRoot(overrides?: CallOverrides): Promise<string>;

  emptyRoot(overrides?: CallOverrides): Promise<string>;

  strConfigBytes(
    enabled: PromiseOrValue<boolean>,
    startTime: PromiseOrValue<BigNumberish>,
    endTime: PromiseOrValue<BigNumberish>,
    mintCharge: PromiseOrValue<BigNumberish>,
    whitelistRoot: PromiseOrValue<BytesLike>,
    maxMintPerWallet: PromiseOrValue<BigNumberish>,
    maxMintInSale: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<string>;

  verify(
    proof: PromiseOrValue<BytesLike>[],
    root: PromiseOrValue<BytesLike>,
    leaf: PromiseOrValue<BytesLike>,
    overrides?: CallOverrides
  ): Promise<void>;

  verifyConfig(
    proof: PromiseOrValue<BytesLike>[],
    enabled: PromiseOrValue<boolean>,
    startTime: PromiseOrValue<BigNumberish>,
    endTime: PromiseOrValue<BigNumberish>,
    mintCharge: PromiseOrValue<BigNumberish>,
    whitelistRoot: PromiseOrValue<BytesLike>,
    maxMintPerWallet: PromiseOrValue<BigNumberish>,
    maxMintInSale: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<boolean>;

  callStatic: {
    configRoot(overrides?: CallOverrides): Promise<string>;

    emptyRoot(overrides?: CallOverrides): Promise<string>;

    strConfigBytes(
      enabled: PromiseOrValue<boolean>,
      startTime: PromiseOrValue<BigNumberish>,
      endTime: PromiseOrValue<BigNumberish>,
      mintCharge: PromiseOrValue<BigNumberish>,
      whitelistRoot: PromiseOrValue<BytesLike>,
      maxMintPerWallet: PromiseOrValue<BigNumberish>,
      maxMintInSale: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<string>;

    verify(
      proof: PromiseOrValue<BytesLike>[],
      root: PromiseOrValue<BytesLike>,
      leaf: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<void>;

    verifyConfig(
      proof: PromiseOrValue<BytesLike>[],
      enabled: PromiseOrValue<boolean>,
      startTime: PromiseOrValue<BigNumberish>,
      endTime: PromiseOrValue<BigNumberish>,
      mintCharge: PromiseOrValue<BigNumberish>,
      whitelistRoot: PromiseOrValue<BytesLike>,
      maxMintPerWallet: PromiseOrValue<BigNumberish>,
      maxMintInSale: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<boolean>;
  };

  filters: {};

  estimateGas: {
    configRoot(overrides?: CallOverrides): Promise<BigNumber>;

    emptyRoot(overrides?: CallOverrides): Promise<BigNumber>;

    strConfigBytes(
      enabled: PromiseOrValue<boolean>,
      startTime: PromiseOrValue<BigNumberish>,
      endTime: PromiseOrValue<BigNumberish>,
      mintCharge: PromiseOrValue<BigNumberish>,
      whitelistRoot: PromiseOrValue<BytesLike>,
      maxMintPerWallet: PromiseOrValue<BigNumberish>,
      maxMintInSale: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    verify(
      proof: PromiseOrValue<BytesLike>[],
      root: PromiseOrValue<BytesLike>,
      leaf: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    verifyConfig(
      proof: PromiseOrValue<BytesLike>[],
      enabled: PromiseOrValue<boolean>,
      startTime: PromiseOrValue<BigNumberish>,
      endTime: PromiseOrValue<BigNumberish>,
      mintCharge: PromiseOrValue<BigNumberish>,
      whitelistRoot: PromiseOrValue<BytesLike>,
      maxMintPerWallet: PromiseOrValue<BigNumberish>,
      maxMintInSale: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    configRoot(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    emptyRoot(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    strConfigBytes(
      enabled: PromiseOrValue<boolean>,
      startTime: PromiseOrValue<BigNumberish>,
      endTime: PromiseOrValue<BigNumberish>,
      mintCharge: PromiseOrValue<BigNumberish>,
      whitelistRoot: PromiseOrValue<BytesLike>,
      maxMintPerWallet: PromiseOrValue<BigNumberish>,
      maxMintInSale: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    verify(
      proof: PromiseOrValue<BytesLike>[],
      root: PromiseOrValue<BytesLike>,
      leaf: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    verifyConfig(
      proof: PromiseOrValue<BytesLike>[],
      enabled: PromiseOrValue<boolean>,
      startTime: PromiseOrValue<BigNumberish>,
      endTime: PromiseOrValue<BigNumberish>,
      mintCharge: PromiseOrValue<BigNumberish>,
      whitelistRoot: PromiseOrValue<BytesLike>,
      maxMintPerWallet: PromiseOrValue<BigNumberish>,
      maxMintInSale: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}
