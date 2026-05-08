import { fallback, routes } from "./routes/router.js";

Bun.serve({
  port: Number(process.env.PORT) || 3000,
  routes,
  fetch: fallback,
});
