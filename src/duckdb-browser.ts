// src/duckdb-browser.ts

import {
  getJsDelivrBundles,
  selectBundle,
  ConsoleLogger,
  createWorker,
  AsyncDuckDB,
} from '@duckdb/duckdb-wasm';


export async function getDuckDB(
  location: string,
  dbMode?: number,
  dbCallback?: (err: Error | null) => void
) {
  const JSDELIVR_BUNDLES = getJsDelivrBundles();
  const bundle = await selectBundle(JSDELIVR_BUNDLES);
  const logger = new ConsoleLogger();

  if (!bundle.mainWorker) {
    throw new Error('No mainWorker found in bundle');
  }

  const worker = await createWorker(bundle.mainWorker);
  const db = new AsyncDuckDB(logger, worker);

  await db.instantiate(bundle.mainModule, bundle.pthreadWorker || undefined);
  const connection = await db.connect();

  return { db, connection };
}
