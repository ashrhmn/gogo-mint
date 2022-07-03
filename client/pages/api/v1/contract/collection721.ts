import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { get721CompiledContract } from "../../../../controllers/codegen.controller";

export default nextConnect<NextApiRequest, NextApiResponse>().get(
  get721CompiledContract
);
