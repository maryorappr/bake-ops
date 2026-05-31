import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL || "postgresql://cookieops:cookieops@localhost:5432/cookieops";

export const pool = new Pool({ connectionString });

export async function withClient(callback) {
  const client = await pool.connect();
  try {
    return await callback(client);
  } finally {
    client.release();
  }
}
