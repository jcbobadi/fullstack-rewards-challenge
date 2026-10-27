import test from "node:test";
import assert from "node:assert/strict";
import { app } from "../src/app.js";

let server;
let baseUrl;

test.before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => server?.close());

test("health endpoint responde OK", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
});

test("productos devuelve paginación", async () => {
  const response = await fetch(`${baseUrl}/api/products?page=1&limit=2`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.data.length, 2);
  assert.equal(body.pagination.page, 1);
  assert.ok(body.pagination.total >= 2);
});

test("paginación inválida devuelve 400", async () => {
  const response = await fetch(`${baseUrl}/api/products?page=0`);
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, "INVALID_PAGINATION");
});

test("la API calcula puntos y no acepta puntos enviados por el cliente", async () => {
  const response = await fetch(`${baseUrl}/api/rewards/actions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ userId: 1, productId: 1, action: "ADD_TO_CART", points: 999999 })
  });
  const body = await response.json();
  assert.equal(response.status, 201);
  assert.equal(body.awarded, 10);
  assert.equal(body.points, 10);
});
