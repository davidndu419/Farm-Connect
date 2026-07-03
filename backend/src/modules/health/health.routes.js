import { Router } from "express";
import { sendData } from "../../utils/responses.js";

export function createHealthRouter() {
  const router = Router();

  router.get("/", (_request, response) => {
    sendData(response, {
      status: "ok",
      service: "farm-connect-api",
      timestamp: new Date().toISOString()
    });
  });

  return router;
}
