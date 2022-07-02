import axios from "axios";
import { GetServerSidePropsContext, NextApiRequest, PreviewData } from "next";
import { ParsedUrlQuery } from "querystring";
import { ENV_PROTOCOL } from "./constants/configuration";

export const service = axios.create({ baseURL: "/api/v1/" });
export const serverSideService = (
  context: GetServerSidePropsContext<ParsedUrlQuery, PreviewData>
) =>
  axios.create({
    baseURL: `${ENV_PROTOCOL}://${context.req.headers.host}/api/v1/`,
  });
