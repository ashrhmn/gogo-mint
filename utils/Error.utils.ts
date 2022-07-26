import { NextApiResponse } from "next";
import { errorResponse } from "./Response.utils";
import { z, ZodError } from "zod";

export const handleControllerError = (res: NextApiResponse, error: unknown) => {
  console.log(
    "Controller Error : ",
    error instanceof ZodError ? error.flatten() : error
  );
  return res
    .status(500)
    .json(errorResponse(error instanceof ZodError ? error.flatten() : error));
};

export const errorHasMessage = (
  error: unknown
): error is { message: string } => {
  return z.object({ message: z.string() }).safeParse(error).success;
};
