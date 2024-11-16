// src/databaseLoader.ts

export async function loadDuckDB() {
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    // Node.js environment
    const duckdb = await import('duckdb');
    return duckdb.default || duckdb;
  } else {
    // Browser environment
    const duckdb = await import('@duckdb/duckdb-wasm');
    return duckdb.default || duckdb;
  }
}
