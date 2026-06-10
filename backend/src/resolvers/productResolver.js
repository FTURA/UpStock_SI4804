import pool from '../db/connection.js';

export const productResolver = {
  Query: {
    getAllProducts: async () => {
      const result = await pool.query('SELECT * FROM products');
      return result.rows;
    },
    getProductById: async (_, { id }) => {
      const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
      return result.rows[0];
    },
    getLowStockProducts: async (_, { threshold }) => {
      const result = await pool.query('SELECT * FROM products WHERE stock <= $1', [threshold]);
      return result.rows;
    },
  },
  Mutation: {
    addProduct: async (_, { name, price, stock, categoryId, supplierId }) => {
      const result = await pool.query(
        'INSERT INTO products (name, price, stock, category_id, supplier_id) VALUES ($1,$2,$3,$4,$5) RETURNING *',
        [name, price, stock, categoryId || null, supplierId || null]
      );
      return result.rows[0];
    },
    updateStock: async (_, { productId, quantity, type, note }) => {
      // Catat transaksi
      await pool.query(
        'INSERT INTO transactions (product_id, type, quantity, note) VALUES ($1,$2,$3,$4)',
        [productId, type, quantity, note || null]
      );
      // Update stok
      const operator = type === 'IN' ? '+' : '-';
      const result = await pool.query(
        `UPDATE products SET stock = stock ${operator} $1 WHERE id = $2 RETURNING *`,
        [quantity, productId]
      );
      return result.rows[0];
    },
    deleteProduct: async (_, { id }) => {
      await pool.query('DELETE FROM products WHERE id = $1', [id]);
      return true;
    },
  },
  // Relasi: ambil data category & supplier dari product
  Product: {
    category: async (parent) => {
      if (!parent.category_id) return null;
      const result = await pool.query('SELECT * FROM categories WHERE id = $1', [parent.category_id]);
      return result.rows[0];
    },
    supplier: async (parent) => {
      if (!parent.supplier_id) return null;
      const result = await pool.query('SELECT * FROM suppliers WHERE id = $1', [parent.supplier_id]);
      return result.rows[0];
    },
  },
};