import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app";

describe("GET /", () => {
  it("responds to the world", async () => {
    const res = await request(app).get("/").set("Accept", "application/json");

    expect(res.status).toBe(200);
    expect(res.type).toBe("application/json");
    expect(res.body.message).toBe("Hello World!");
  });
});

describe("GET /404", () => {
  it("responds with a 404", async () => {
    const res = await request(app).get("/404").set("Accept", "application/json");

    expect(res.status).toBe(404);
  });
});
