import { ApiError } from "../utils/ApiError.js";

export function notFound(request, response, next) {
  next(
    ApiError.notFound(`No route matches ${request.method} ${request.path}.`)
  );
}
