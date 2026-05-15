import { Pool, QueryResult } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 10_000,
      ssl: { rejectUnauthorized: false },
    });
    pool.on('error', () => {});
  }
  return pool;
}

export async function query<T>(sql: string, params?: unknown[]): Promise<T[]> {
  return new Promise((resolve, reject) => {
    getPool().query(sql, params ?? [], (err, result: QueryResult) => {
      if (err) return reject(err);
      resolve(result.rows as T[]);
    });
  });
}

export async function queryOne<T>(sql: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function execute(sql: string, params?: unknown[]): Promise<number> {
  return new Promise((resolve, reject) => {
    getPool().query(sql, params ?? [], (err, result: QueryResult) => {
      if (err) return reject(err);
      resolve(result.rowCount ?? 0);
    });
  });
}

export async function healthCheck(): Promise<boolean> {
  try {
    await new Promise<void>((resolve, reject) => {
      getPool().query('SELECT 1', (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    return true;
  } catch {
    return false;
  }
}

export async function end(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}