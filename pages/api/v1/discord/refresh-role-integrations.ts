import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { refreshRoleIntegrations } from "../../../../controllers/discord.controller";

export default nextConnect<NextApiRequest, NextApiResponse>().post(
  refreshRoleIntegrations
);
