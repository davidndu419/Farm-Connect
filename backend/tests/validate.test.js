import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { errorHandler } from "../src/middleware/errorHandler.js";
import { requestId } from "../src/middleware/requestId.js";
import { validate } from "../src/middleware/validate.js";

describe("request validation", () => {
  it("returns structured field errors", async () => {
    const app = express();
    app.use(requestId, express.json());
    app.post(
      "/value",
      validate({
        body: z.object({ count: z.number().int().positive() })
      }),
      (_request, response) => response.sendStatus(204)
    );
    app.use(errorHandler);

    const response = await request(app).post("/value").send({ count: -1 });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatchObject({
      code: "BAD_REQUEST",
      message: "Request validation failed.",
      details: [
        {
          source: "body",
          path: "count"
        }
      ]
    });
  });

  it("names unexpected strict-schema fields explicitly", async () => {
    const app = express();
    app.use(requestId, express.json());
    app.post(
      "/value",
      validate({
        body: z.object({ name: z.string() }).strict()
      }),
      (_request, response) => response.sendStatus(204)
    );
    app.use(errorHandler);

    const response = await request(app)
      .post("/value")
      .send({ name: "Ada", avatar: "[object FileList]" });

    expect(response.status).toBe(400);
    expect(response.body.error.details).toContainEqual({
      source: "body",
      path: "avatar",
      message: "Unexpected field."
    });
  });

  it("stores parsed query defaults without assigning Express 5 request.query", async () => {
    const app = express();
    app.use(requestId);
    app.get(
      "/products",
      validate({
        query: z.object({
          sort: z.enum(["newest", "price_asc"]).default("newest"),
          limit: z.coerce.number().int().default(20)
        })
      }),
      (request, response) => response.json(request.validated.query)
    );
    app.use(errorHandler);

    const response = await request(app).get("/products");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ sort: "newest", limit: 20 });
  });
});
