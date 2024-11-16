// src/duckdb-node.ts

import duckdb from 'duckdb';

export async function getDuckDB(
  location: string,
  dbMode?: number,
  dbCallback?: (err: Error | null) => void
) {
  const db = new duckdb.Database(location, dbMode, dbCallback);
  const connection = db.connect();
  return { db, connection };
}
