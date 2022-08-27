import { ZodError } from "zod";

export const errorResponse = (errorMessage: string | any) => ({
  data: null,
  error:
    errorMessage instanceof ZodError ? errorMessage.flatten() : errorMessage,
});

export const successResponse = (data: any) => ({ data, error: null });

export const authPageUrlWithMessage = (msg: string) =>
  `/api/v1/auth/redirect?message=${msg}`;
