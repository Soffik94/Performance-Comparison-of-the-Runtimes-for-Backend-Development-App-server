//je voláno z kontroleru
import { getClient, usersTable } from "../db/pool.js";

export const createUser = async (name, email) => {
  const client = await getClient();

  try {
    const result = await client.queryObject(
      `INSERT INTO ${usersTable} (name, email) VALUES ($1, $2) RETURNING *`,
      [name, email]
    );

    return result.rows[0];
  } finally {
    client.release();
  }
};

export const getUsers = async () => {
  const client = await getClient();

  try {
    const result = await client.queryObject(
      `SELECT id, name, email, created_at FROM ${usersTable} ORDER BY id DESC LIMIT 1`
    );

    return result.rows;
  } finally {

    
    client.release();
  }
};
