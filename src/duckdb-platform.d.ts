// src/duckdb-platform.d.ts

declare module 'duckdb-platform' {
  export function getDuckDB(
    location?: string,
    dbMode?: number,
    dbCallback?: (err: Error | null) => void
  ): Promise<{ db: any; connection: any }>;
}
