import pool from '../db/connection.js';

export const transactionResolver = {
  Query: {
    getAllTransactions: async () => {
      const result = await pool.query('SELECT * FROM transactions ORDER BY created_at DESC');
      return result.rows;
    },
  },
  Transaction: {
    product: async (parent) => {
      const result = await pool.query('SELECT * FROM products WHERE id = $1', [parent.product_id]);
      return result.rows[0];
    },
    createdAt: (parent) => parent.created_at?.toISOString() || null,
  },
};