import { getUsers, createUser } from "../controllers/users.controller.js";
import { computeHash } from "../controllers/compute.controller.js";

const routedPaths = new Set(["/ping", "/items", "/compute"]);

export const routes = {
  "/ping": {
    GET: () => Response.json({ message: "pong" }),
  },

  "/items": {
    GET: getUsers,
    POST: createUser,
  },

  "/compute": {
    GET: (req) => Response.json(computeHash(new URL(req.url))),
  },
};

export function fallback(req) {
  const url = new URL(req.url);

  if (routedPaths.has(url.pathname)) {
    return Response.json({ error: "method not allowed" }, { status: 405 });
  }

  return Response.json({ error: "not found" }, { status: 404 });
}
