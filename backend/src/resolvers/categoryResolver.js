import pool from '../db/connection.js';

export const categoryResolver = {
  Query: {
    getAllCategories: async () => {
      const result = await pool.query('SELECT * FROM categories');
      return result.rows;
    },
  },
  Mutation: {
    addCategory: async (_, { name, description }) => {
      const result = await pool.query(
        'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
        [name, description || null]
      );
      return result.rows[0];
    },
  },
};