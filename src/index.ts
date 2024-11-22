// src/index.ts

import { getDuckDB } from 'duckdb-platform'; // This will be aliased to the correct module
import type { DataFactory, Term, Stream as RDFStream, Store } from '@rdfjs/types';
import { EventEmitter } from 'events';
import { Readable } from 'stream';
import { DataFactoryClass }  from '@rdfjs/data-model';

//export { dataFactory as DataFactory };

interface ConstructorOptions {
  dataFactory?: DataFactory;
  baseIRI?: string;
  location?: string;
  dbMode?: number;
  dbCallback?: (err: Error | null) => void;
}

export class RDFDb implements Store {
  private dataFactory: DataFactory;
  private baseIRI?: string;
  private db: any;
  private connection: any;

  private constructor() {
    // Private constructor
  }

  static async create(options: ConstructorOptions = {}): Promise<RDFDb> {
    const instance = new RDFDb();
    const {
      dataFactory = new DataFactoryClass(),
      /*
      dataFactory = {
        quad: (s, p, o, g) => ({ subject: s, predicate: p, object: o, graph: g }),
        namedNode: (value) => ({ termType: 'NamedNode', value }),
        blankNode: (value) => ({ termType: 'BlankNode', value }),
        literal: (value, languageOrDatatype) => ({
          termType: 'Literal',
          value,
          language: typeof languageOrDatatype === 'string' ? languageOrDatatype : '',
          datatype:
            typeof languageOrDatatype === 'object'
              ? languageOrDatatype
              : { termType: 'NamedNode', value: 'http://www.w3.org/2001/XMLSchema#string' },
        }),
        variable: (value) => ({ termType: 'Variable', value }),
        defaultGraph: () => ({ termType: 'DefaultGraph', value: '' }),
      },
       */
      baseIRI,
      location = ':memory:',
      dbMode,
      dbCallback,
    } = options;
    instance.dataFactory = dataFactory;
    instance.baseIRI = baseIRI;

    const { db, connection } = await getDuckDB(location, dbMode, dbCallback);
    instance.db = db;
    instance.connection = connection;

    await instance.ensureStructure();
    return instance;
  }

  private async ensureStructure(): Promise<void> {
    await this.connection.run(`
      CREATE TABLE IF NOT EXISTS quads (
        subject TEXT NOT NULL,
        predicate TEXT NOT NULL,
        object TEXT NOT NULL,
        graph TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_subject ON quads (subject);
      CREATE INDEX IF NOT EXISTS idx_predicate ON quads (predicate);
      CREATE INDEX IF NOT EXISTS idx_object ON quads (object);
      CREATE INDEX IF NOT EXISTS idx_graph ON quads (graph);
    `);
  }

  read(): any {
    // Implement the read method if necessary
    throw new Error('read() not implemented');
  }

  match(
    subject?: Term | null,
    predicate?: Term | null,
    object?: Term | null,
    graph?: Term | null
  ): RDFStream {
    const whereClauses = [];
    const params = [];

    if (subject) {
      whereClauses.push('subject = ?');
      params.push(subject.value);
    }
    if (predicate) {
      whereClauses.push('predicate = ?');
      params.push(predicate.value);
    }
    if (object) {
      whereClauses.push('object = ?');
      params.push(object.value);
    }
    if (graph) {
      whereClauses.push('graph = ?');
      params.push(graph.value);
    }

    const whereClause = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const query = `SELECT subject, predicate, object, graph FROM quads ${whereClause};`;

    const stream = new Readable({
      objectMode: true,
      read: () => {},
    });

    this.connection.each(
      query,
      params,
      (err: Error | null, row: any) => {
        if (err) {
          stream.emit('error', err);
        } else {
          const quad = this.dataFactory.quad(
            this.dataFactory.namedNode(row.subject),
            this.dataFactory.namedNode(row.predicate),
            this.dataFactory.namedNode(row.object),
            this.dataFactory.namedNode(row.graph)
          );
          stream.push(quad);
        }
      },
      () => {
        stream.push(null); // Signal end of stream
      }
    );

    return stream;
  }

  import(stream: RDFStream): EventEmitter {
    const emitter = new EventEmitter();

    const insertQuad = this.connection.prepare(`
      INSERT INTO quads (subject, predicate, object, graph) VALUES (?, ?, ?, ?);
    `);

    stream.on('data', async (quad) => {
      try {
        await insertQuad.run([
          quad.subject.value,
          quad.predicate.value,
          quad.object.value,
          quad.graph.value,
        ]);
      } catch (err) {
        emitter.emit('error', err);
      }
    });

    stream.on('end', () => {
      insertQuad.finalize();
      emitter.emit('end');
    });

    stream.on('error', (err) => {
      emitter.emit('error', err);
    });

    return emitter;
  }

  remove(stream: RDFStream): EventEmitter {
    const emitter = new EventEmitter();

    stream.on('data', async (quad) => {
      try {
        await this.connection.run(
          `DELETE FROM quads WHERE subject = ? AND predicate = ? AND object = ? AND graph = ?;`,
          [quad.subject.value, quad.predicate.value, quad.object.value, quad.graph.value]
        );
      } catch (err) {
        emitter.emit('error', err);
      }
    });

    stream.on('end', () => {
      emitter.emit('end');
    });

    stream.on('error', (err) => {
      emitter.emit('error', err);
    });

    return emitter;
  }

  removeMatches(
    subject?: Term | null,
    predicate?: Term | null,
    object?: Term | null,
    graph?: Term | null
  ): EventEmitter {
    const emitter = new EventEmitter();

    const whereClauses = [];
    const params = [];

    if (subject) {
      whereClauses.push('subject = ?');
      params.push(subject.value);
    }
    if (predicate) {
      whereClauses.push('predicate = ?');
      params.push(predicate.value);
    }
    if (object) {
      whereClauses.push('object = ?');
      params.push(object.value);
    }
    if (graph) {
      whereClauses.push('graph = ?');
      params.push(graph.value);
    }

    const whereClause = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';

    this.connection.run(`DELETE FROM quads ${whereClause};`, params, (err) => {
      if (err) {
        emitter.emit('error', err);
      } else {
        emitter.emit('end');
      }
    });

    return emitter;
  }

  deleteGraph(graph: Term | string): EventEmitter {
    const emitter = new EventEmitter();

    const graphValue = typeof graph === 'string' ? graph : graph.value;

    this.connection.run(
      `DELETE FROM quads WHERE graph = ?;`,
      [graphValue],
      (err) => {
        if (err) {
          emitter.emit('error', err);
        } else {
          emitter.emit('end');
        }
      }
    );

    return emitter;
  }
}
