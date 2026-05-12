const { pool, usersTable } = require('../db/pool');

const createUser = async (name, email) => {
  const result = await pool.query(
    `INSERT INTO ${usersTable} (name, email) VALUES ($1, $2) RETURNING *`,
    [name, email]
  );

  return result.rows[0];
};

const getUsers = async () => {
  const result = await pool.query(
    `SELECT id, name, email, created_at FROM ${usersTable} ORDER BY id DESC LIMIT 1`
  );
  return result.rows;
};

module.exports = {
  createUser,
  getUsers,
};
