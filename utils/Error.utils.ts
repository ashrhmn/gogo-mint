import { NextApiResponse } from "next";
import { errorResponse } from "./Response.utils";
import { ZodError } from "zod";

export const handleControllerError = (res: NextApiResponse, error: unknown) => {
  console.log(
    "Controller Error : ",
    error instanceof ZodError ? error.flatten() : error
  );
  return res.json(
    errorResponse(error instanceof ZodError ? error.flatten() : error)
  );
};
