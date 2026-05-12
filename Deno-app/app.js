import { router } from "./routes/router.js";

export default async function handler(req) {
  try {
    return await router(req);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "internal error" }, { status: 500 });
  }
}
