import { NextApiRequest, NextApiResponse } from "next";
import nextConnect from "next-connect";
// import { updateNftCreationSignature } from "../../../../controllers/nft.controller";

export default nextConnect<NextApiRequest, NextApiResponse>();
// .use(onlyValidUser)
// .put(updateNftCreationSignature);
