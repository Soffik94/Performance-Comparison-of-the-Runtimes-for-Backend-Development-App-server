import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const dbSchema = Deno.env.get("DB_SCHEMA") || "deno_schema";
const poolSize = Number(Deno.env.get("DB_POOL_MAX")) || 30;

const quoteIdent = (identifier) => {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(`Invalid database identifier: ${identifier}`);
  }

  return `"${identifier}"`;
};

const pool = new Pool({
  hostname: Deno.env.get("DB_HOST"),
  port: Number(Deno.env.get("DB_PORT")),
  user: Deno.env.get("DB_USER"),
  password: Deno.env.get("DB_PASSWORD"),
  database: Deno.env.get("DB_NAME"),
}, poolSize);

export async function getClient() {
  return await pool.connect();
}

export const usersTable = `${quoteIdent(dbSchema)}.${quoteIdent("users")}`;

