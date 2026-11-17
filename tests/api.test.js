require("dotenv").config();
const test = require("node:test");
const assert = require("node:assert/strict");
const app = require("../src/app");

let server;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test("la raíz responde JSON", async () => {
  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).message, "API Catálogo de Productos");
});

test("ruta protegida rechaza petición sin token", async () => {
  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/favoritos`);
  assert.equal(response.status, 401);
});

test("producto inexistente devuelve 404", async () => {
  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/productos/999999`);
  assert.equal(response.status, 404);
});
