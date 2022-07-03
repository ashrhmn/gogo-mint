export const errorResponse = (errorMessage: string | any) => ({
  data: null,
  error: errorMessage,
});

export const successResponse = (data: any) => ({ data, error: null });
