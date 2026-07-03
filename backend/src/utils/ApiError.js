export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message, details) {
    return new ApiError(400, "BAD_REQUEST", message, details);
  }

  static unauthorized(message = "Authentication is required.") {
    return new ApiError(401, "UNAUTHORIZED", message);
  }

  static forbidden(message = "You do not have permission to perform this action.") {
    return new ApiError(403, "FORBIDDEN", message);
  }

  static notFound(message = "The requested resource was not found.") {
    return new ApiError(404, "NOT_FOUND", message);
  }

  static conflict(message, details) {
    return new ApiError(409, "CONFLICT", message, details);
  }
}
