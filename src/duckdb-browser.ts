// src/duckdb-browser.ts

import duckdb from '@duckdb/duckdb-wasm';

export async function getDuckDB(
  location: string,
  dbMode?: number,
  dbCallback?: (err: Error | null) => void
) {
  const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
  const logger = new duckdb.ConsoleLogger();

  if (!bundle.mainWorker) {
    throw new Error('No mainWorker found in bundle');
  }

  const worker = await duckdb.createWorker(bundle.mainWorker);
  const db = new duckdb.AsyncDuckDB(logger, worker);

  await db.instantiate(bundle.mainModule, bundle.pthreadWorker || undefined);
  const connection = await db.connect();

  return { db, connection };
}
