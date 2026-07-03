import { randomUUID } from "node:crypto";

export function requestId(request, response, next) {
  const suppliedId = request.get("x-request-id");
  request.id =
    suppliedId && suppliedId.length <= 100 ? suppliedId : randomUUID();
  response.set("x-request-id", request.id);
  next();
}
