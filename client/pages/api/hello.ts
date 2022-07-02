// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { getAllUser } from "../../controllers/User";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return getAllUser(req, res);
}
