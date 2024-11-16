// src/index.ts

import * as NodeDuckDB from 'duckdb';
import * as WasmDuckDB from '@duckdb/duckdb-wasm';

export class RDFDb {
  // ... [Existing properties]

  private constructor() {
    // Private constructor
  }

  static async create(options: ConstructorOptions = {}): Promise<RDFDb> {
    const instance = new RDFDb();
    const { dataFactory, baseIRI, location = ':memory:', dbMode, dbCallback } = options;
    instance.dataFactory = dataFactory;
    instance.baseIRI = baseIRI;
    await instance.initDatabase(location, dbMode, dbCallback);
    return instance;
  }

  private async initDatabase(location: string, dbMode?: number, dbCallback?: (err: Error | null) => void) {
    let duckdb: any;

    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      // Node.js environment
      duckdb = NodeDuckDB;
      this.db = new duckdb.Database(location, dbMode, dbCallback);
      this.connection = this.db.connect();
    } else {
      // Browser environment
      duckdb = WasmDuckDB;
      const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
      const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
      const logger = new duckdb.ConsoleLogger();
      const worker = await duckdb.createWorker(bundle.mainWorker);
      const db = new duckdb.AsyncDuckDB(logger, worker);

      await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
      this.db = db;
      this.connection = await db.connect();
    }

    await this.ensureStructure();
  }

  // ... [Rest of the class methods]
}
