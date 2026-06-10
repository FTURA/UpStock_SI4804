import pool from '../db/connection.js';

export const supplierResolver = {
  Query: {
    getAllSuppliers: async () => {
      const result = await pool.query('SELECT * FROM suppliers');
      return result.rows;
    },
  },
  Mutation: {
    addSupplier: async (_, { name, contact, address }) => {
      const result = await pool.query(
        'INSERT INTO suppliers (name, contact, address) VALUES ($1, $2, $3) RETURNING *',
        [name, contact || null, address || null]
      );
      return result.rows[0];
    },
  },
};