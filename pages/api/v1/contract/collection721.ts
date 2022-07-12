import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
import { get721CompiledContract } from "../../../../controllers/codegen.controller";
import onlyValidUser from "../../../../middlewares/user";

export default nextConnect<NextApiRequest, NextApiResponse>().get(
  get721CompiledContract
);

// export default nextConnect<NextApiRequest, NextApiResponse>()
//   .use(onlyValidUser)
//   .get(get721CompiledContract);
