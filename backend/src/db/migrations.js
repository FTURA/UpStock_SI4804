import pool from './connection.js';

const migrate = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      contact VARCHAR(100),
      address TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      price NUMERIC(12,2) NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      category_id INTEGER REFERENCES categories(id),
      supplier_id INTEGER REFERENCES suppliers(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(id),
      type VARCHAR(10) NOT NULL CHECK (type IN ('IN','OUT')),
      quantity INTEGER NOT NULL,
      note TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('✅ Migrasi tabel selesai');
};

export default migrate;