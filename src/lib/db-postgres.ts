import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.FLYER_DATABASE_HOST,
  port: parseInt(process.env.FLYER_DATABASE_PORT || '5432'),
  user: process.env.FLYER_DATABASE_USER,
  password: process.env.FLYER_DATABASE_PASSWORD,
  database: process.env.FLYER_DATABASE_NAME,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
}
