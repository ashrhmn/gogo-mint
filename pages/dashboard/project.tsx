import { shortenIfAddress, useEthers } from "@usedapp/core";
import { providers } from "ethers";
import { isAddress } from "ethers/lib/utils";
import { GetServerSideProps, NextPage } from "next";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import CopyAddressToClipboard from "../../components/Common/CopyAddressToClipboard";
import Layout from "../../components/Layout";
import BatchCreateModal from "../../components/ProjectDashboard/BatchCreateModal";
import ClaimsSection from "../../components/ProjectDashboard/Claims";
import CreateModal from "../../components/ProjectDashboard/CreateModal";
import OverviewSection from "../../components/ProjectDashboard/Overview";
import SettingsSection from "../../components/ProjectDashboard/Settings";
import { RPC_URLS } from "../../constants/RPC_URL";
import {
  Collection721__factory,
  Collection1155__factory,
} from "../../ContractFactory";
import { getCookieWallet } from "../../services/auth.service";

import {
  getClaimedSupplyCountByProjectChainAddress,
  getProjectByChainAddress,
  getTotalSupplyCountByProjectChainAddress,
} from "../../services/project.service";
import { getUserByWalletAddress } from "../../services/user.service";
import { ProjectExtended } from "../../types";
import { errorHasMessage } from "../../utils/Error.utils";
import { getHttpCookie } from "../../utils/Request.utils";
import { authPageUrlWithMessage } from "../../utils/Response.utils";
import { service } from "../../service";
import toast from "react-hot-toast";
import { getIfCached } from "../../lib/redis";

interface Props {
  project: ProjectExtended & { _count: { nfts: number } };
  cookieAddress: string;
  unclaimedSupply: number;
  claimedSupply: number;
  page: number;
  view: number;
  mintStatus: "all" | "minted" | "unminted";
  // serverList: IGuild[] | null;
  // discordUser: DiscordUserResponse | null;
}

const ProjectPage: NextPage<Props> = ({
  project,
  cookieAddress,
  claimedSupply,
  unclaimedSupply,
  page,
  view,
  mintStatus,
  // serverList,
  // discordUser,
}) => {
  const router = useRouter();
  const { account } = useEthers();
  const [maxCapLimit, setMaxCapLimit] = useState(-1);
  useEffect(() => {
    if (account && account !== cookieAddress)
      router.push(
        authPageUrlWithMessage(
          `Signed in wallet is ${shortenIfAddress(
            cookieAddress
          )}, but connected wallet is ${shortenIfAddress(
            account
          )}. Please Sign with current wallet`
        )
      );
  }, [account, cookieAddress, router]);

  useEffect(() => {
    (async () => {
      setMaxCapLimit(
        await (async () => {
          const rpcUrl = RPC_URLS[project.chainId || 0];
          if (!rpcUrl || !project.address) return -1;
          const contract =
            project.collectionType === "721"
              ? Collection721__factory.connect(
                  project.address,
                  new providers.StaticJsonRpcProvider(rpcUrl)
                )
              : project.collectionType === "1155"
              ? Collection1155__factory.connect(
                  project.address,
                  new providers.StaticJsonRpcProvider(rpcUrl)
                )
              : null;
          if (!contract) return -1;
          return await contract
            .state()
            .then((s) => s.maxMintCap)
            .then((v) => v.toNumber())
            .catch(() => -1);
        })()
      );
    })();
  }, [project.address, project.chainId, project.collectionType]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBatchCreateModalOpen, setIsBatchCreateModalOpen] = useState(false);
  const setTab = (tab: string) =>
    router.push({ ...router, query: { ...router.query, tab } });
  const currentTab =
    typeof router.query.tab === "string" &&
    ["permissions", "claims", "settings"].includes(router.query.tab)
      ? router.query.tab
      : "overview";

  const handleRandomize = async () =>
    await toast
      .promise(service.get(`projects/randomize-token-ids/${project.id}`), {
        error: "Error Randomizing NFTs",
        loading: "Randomizing NFTs",
        success: "Randomized NFTs",
      })
      .then(() => router.reload());

  return (
    <Layout dashboard>
      <div className="flex flex-col sm:flex-row gap-2 justify-between my-4">
        <div className="flex gap-4">
          {project.imageUrl && (
            <a className="h-28 w-28 relative">
              <Image src={project.imageUrl} alt={""} layout="fill" />
            </a>
          )}
          <div>
            <h1 className="text-4xl font-bold">{project.name}</h1>
            <h2 className="text-2xl font-medium mt-4">
              {!!project.address && (
                <CopyAddressToClipboard address={project.address} shorten />
              )}
            </h2>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {project.collectionType === "721" ? (
            <button
              className="bg-sky-600 text-white px-3 py-2 w-36 rounded hover:bg-sky-700 transition-colors whitespace-nowrap"
              onClick={() => setIsBatchCreateModalOpen(true)}
            >
              + Create Batch
            </button>
          ) : project.collectionType === "1155" && project._count.nfts === 0 ? (
            <button
              className="bg-sky-600 text-white px-3 py-2 w-24 rounded hover:bg-sky-700 transition-colors"
              onClick={() => setIsCreateModalOpen(true)}
            >
              + Create
            </button>
          ) : null}
          {project.collectionType === "721" && (
            <button
              className="bg-red-600 text-white px-3 py-2 w-30 rounded hover:bg-red-700 transition-colors"
              onClick={handleRandomize}
            >
              Randomize NFTs
            </button>
          )}
        </div>
      </div>
      <div>
        <div className="flex justify-start gap-10 px-8 overflow-x-auto border-b-2 border-gray-600">
          <button
            className={`${
              currentTab === "overview"
                ? "text-indigo-600 border-b-2 border-indigo-600 font-medium"
                : ""
            }`}
            onClick={() => setTab("overview")}
          >
            Overview
          </button>
          <button
            className={`${
              currentTab === "claims"
                ? "text-indigo-600 border-b-2 border-indigo-600 font-medium"
                : ""
            }`}
            onClick={() => setTab("claims")}
          >
            Claim Phases
          </button>
          <button
            className={`${
              currentTab === "settings"
                ? "text-indigo-600 border-b-2 border-indigo-600 font-medium"
                : ""
            }`}
            onClick={() => setTab("settings")}
          >
            Settings
          </button>
        </div>
        <div>
          {currentTab === "overview" && (
            <OverviewSection
              address={project.address}
              projectChainId={project.chainId}
              nfts={project.nfts}
              collectionType={project.collectionType}
              nftCount={project._count.nfts}
              claimedSupply={claimedSupply}
              unclaimedSupply={unclaimedSupply}
              page={page}
              view={view}
              filterStatus={mintStatus}
            />
          )}
        </div>
        <div>
          {currentTab === "claims" && (
            <ClaimsSection
              projectId={project.id}
              projectAddress={project.address}
              projectChainId={project.chainId}
              collectionType={project.collectionType}
              projectOwner={project.owner.walletAddress}
            />
          )}
        </div>
        <div>
          {currentTab === "settings" && (
            <SettingsSection
              projectId={project.id}
              projectAddress={project.address}
              projectChainId={project.chainId}
              collectionType={project.collectionType}
              projectOwner={project.owner.walletAddress}
              // serverList={serverList}
              // discordUser={discordUser}
              roleIntegrations={project.roleIntegrations}
            />
          )}
        </div>
      </div>
      <div
        onClick={() => {
          setIsCreateModalOpen(false);
          setIsBatchCreateModalOpen(false);
        }}
        className={`${
          isCreateModalOpen || isBatchCreateModalOpen
            ? ""
            : "opacity-0 translate-x-full"
        } fixed inset-0 z-50 bg-[rgba(0,0,0,0.5)] transition-opacity`}
      />
      <CreateModal
        isCreateModalOpen={isCreateModalOpen}
        setIsCreateModalOpen={setIsCreateModalOpen}
        projectId={project.id}
        ownerAddress={project.owner.walletAddress}
        collectionType={project.collectionType}
      />
      <BatchCreateModal
        isBatchCreateModalOpen={isBatchCreateModalOpen}
        ownerAddress={project.owner.walletAddress}
        projectId={project.id}
        setIsBatchCreateModalOpen={setIsBatchCreateModalOpen}
        maxCapLimit={maxCapLimit}
        totalSupply={claimedSupply + unclaimedSupply}
      />
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const cookie = getHttpCookie(context.req, context.res);
  try {
    const { contract, network, tab } = context.query;
    // console.log({ tab });

    if (
      !contract ||
      !network ||
      typeof contract !== "string" ||
      typeof network !== "string" ||
      !isAddress(contract) ||
      isNaN(+network)
    )
      return { props: {}, redirect: { destination: `/404` } };
    let cookieAddress: string | null;
    try {
      cookieAddress = getCookieWallet(cookie);
    } catch (error) {
      cookieAddress = null;
    }
    if (!cookieAddress)
      return {
        props: {},
        redirect: { destination: authPageUrlWithMessage("Sign Required") },
      };
    const dbUser = await getUserByWalletAddress(cookieAddress);
    if (!dbUser)
      return {
        props: {},
        redirect: { destination: authPageUrlWithMessage("Sign Required") },
      };
    const { page, view, status } = context.query;
    const mintStatus =
      typeof status === "string" &&
      ["all", "minted", "unminted"].includes(status)
        ? status
        : "all";
    const pageNo = typeof page === "string" && !isNaN(+page) ? +page : 1;
    const take =
      typeof view === "string" && !isNaN(+view)
        ? +view > 100
          ? 100
          : +view
        : 10;
    const skip = (pageNo - 1) * take;

    const project = await getIfCached({
      key: `project-details-with-nfts-${contract}-${network}-${skip}-${take}-${mintStatus}`,
      ttl: 30,
      realtimeDataCb: () =>
        getProjectByChainAddress(
          contract,
          +network,
          skip,
          take,
          mintStatus as "all" | "minted" | "unminted"
        ),
    });

    if (!project) return { props: {}, redirect: { destination: `/404` } };

    // fixMissingTokenIds(project.id);

    if (project.owner.walletAddress !== cookieAddress)
      return {
        props: {},
        redirect: {
          destination: authPageUrlWithMessage(
            "You are not owner of this project, are you logged in with the correct account/wallet?"
          ),
        },
      };

    const [
      claimedSupply,
      totalSupply,
      // serverList,
      //  discordUser
    ] = await Promise.all([
      tab === "overview" || tab === undefined
        ? getIfCached({
            key: `getClaimedSupplyCountByProjectChainAddress:${contract}:${network}`,
            ttl: 60,
            realtimeDataCb: () =>
              getClaimedSupplyCountByProjectChainAddress(contract, +network),
          })
        : null,
      tab === "overview" || tab === undefined
        ? getIfCached({
            key: `getTotalSupplyCountByProjectChainAddress:${contract}:${network}`,
            ttl: 60,
            realtimeDataCb: () =>
              getTotalSupplyCountByProjectChainAddress(contract, +network),
          })
        : null,
      // tab === "settings"
      //   ? getServerListWithAdminOrManageRole(cookie).catch((e) => {
      //       console.log("Error server list : ", e);
      //       return null;
      //     })
      //   : null,
      // tab === "settings"
      //   ? getLoggedInDiscordUser(context.req).catch((err) => null)
      //   : null,
    ]);

    // console.log({ claimedSupply, unclaimedSupply, serverList, discordUser });

    return {
      props: {
        project,
        cookieAddress,
        claimedSupply,
        unclaimedSupply: Math.max(0, (totalSupply || 0) - (claimedSupply || 0)),
        page: pageNo,
        view: take,
        mintStatus,
        // serverList,
        // discordUser,
      },
    };
  } catch (error) {
    return {
      props: {},
      redirect: {
        destination: authPageUrlWithMessage(
          errorHasMessage(error) ? error.message : "Error authenticating user"
        ),
      },
    };
  }
};

export default ProjectPage;
