import { describe, it } from "node:test";
import assert from "node:assert";
import request from "supertest";
import app from "../src/app";

describe("GET /", () => {
  it("responds to the world", async () => {
    const res = await request(app)
      .get("/")
      .set("Accept", "application/json");

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.type, "application/json");
    assert.strictEqual(res.body.message, "Hello World!");
  });
});

describe("GET /404", () => {
  it("responds with a 404", async () => {
    const res = await request(app)
      .get("/404")
      .set("Accept", "application/json");

    assert.strictEqual(res.status, 404);
  });
});
