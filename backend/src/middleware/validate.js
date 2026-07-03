import { ApiError } from "../utils/ApiError.js";

export function validate(schemas) {
  return function validateRequest(request, _response, next) {
    const validationErrors = [];

    for (const [source, schema] of Object.entries(schemas)) {
      const result = schema.safeParse(request[source]);

      if (result.success) {
        request.validated ??= {};
        request.validated[source] = result.data;

        if (source !== "query") {
          request[source] = result.data;
        }
      } else {
        for (const issue of result.error.issues) {
          if (issue.code === "unrecognized_keys") {
            validationErrors.push(
              ...issue.keys.map((key) => ({
                source,
                path: key,
                message: "Unexpected field."
              }))
            );
          } else {
            validationErrors.push({
              source,
              path: issue.path.join("."),
              message: issue.message
            });
          }
        }
      }
    }

    if (validationErrors.length > 0) {
      return next(
        ApiError.badRequest("Request validation failed.", validationErrors)
      );
    }

    return next();
  };
}
