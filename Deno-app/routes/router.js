import { Hono } from "jsr:@hono/hono@4.12.18";
import { handleUsers } from "./users.routes.js";
import { handleCompute } from "./compute.routes.js";

const app = new Hono();
const routedPaths = new Set(["/ping", "/items", "/compute"]);

const methodNotAllowed = (c) => {
  return c.json({ error: "method not allowed" }, 405);
};

app.use("*", async (c, next) => {
  if (c.req.method === "HEAD" && routedPaths.has(c.req.path)) {
    return methodNotAllowed(c);
  }

  await next();
});

app.get("/ping", (c) => {
  return c.json({ message: "pong" });
});
app.all("/ping", methodNotAllowed);

app.get("/items", (c) => handleUsers(c.req.raw));
app.post("/items", (c) => handleUsers(c.req.raw));
app.all("/items", methodNotAllowed);

app.get("/compute", (c) => handleCompute(c.req.raw));
app.all("/compute", methodNotAllowed);

app.notFound((c) => {
  return c.json({ error: "not found" }, 404);
});

export function router(req) {
  return app.fetch(req);
}
