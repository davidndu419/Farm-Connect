import { ApiError } from "../utils/ApiError.js";
import { MulterError } from "multer";

export function errorHandler(error, request, response, _next) {
  void _next;
  let apiError;

  if (error instanceof ApiError) {
    apiError = error;
  } else if (error instanceof MulterError) {
    apiError = ApiError.badRequest(
      error.code === "LIMIT_FILE_SIZE"
        ? "The uploaded image is too large."
        : "The image upload is invalid."
    );
  } else {
    apiError = new ApiError(
      500,
      "INTERNAL_ERROR",
      "An unexpected server error occurred."
    );
  }

  if (apiError.status >= 500) {
    request.log?.error({ err: error }, "Unhandled request error");
  }

  const body = {
    error: {
      code: apiError.code,
      message: apiError.message,
      requestId: request.id
    }
  };

  const isProduction = request.app?.locals?.env?.NODE_ENV === "production";
  if (
    apiError.details !== undefined &&
    (apiError.status < 500 || !isProduction)
  ) {
    body.error.details = apiError.details;
  }

  response.status(apiError.status).json(body);
}
