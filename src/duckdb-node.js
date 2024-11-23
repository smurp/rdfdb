// src/duckdb-node.ts

import duckdb from 'duckdb';

export async function getDuckDB(location, dbMode, dbCallback) {
  const db = new duckdb.Database(location, dbMode, dbCallback);
  const connection = db.connect();
  return db; // { db, connection };
}
