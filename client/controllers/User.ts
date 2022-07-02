import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../prisma/db";

export const getAllUser = async (req: NextApiRequest, res: NextApiResponse) => {
  return res.json(await prisma.user.findMany());
};
