
import {getDuckDB}  from 'duckdb-platform';
import EventEmitter from 'events';
import {Readable} from 'stream';

export const DataFactory = {
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
};

export class RDFDb {
  /*
https://rdf.js.org/stream-spec/#constructoroptions-interface

[Exposed=(Window,Worker)]
interface ConstructorOptions {
  attribute DataFactory? dataFactory;
  attribute DOMString? baseIRI;
  };
  */
  #db;
  #dbPromise;
  constructor(options={}) {
    let {dataFactory, baseIRI, location, dbMode, dbCallback} = options;
    location = location ?? ':memory:';
    this.dataFactory = dataFactory || DataFactory;
    this.baseIRI = baseIRI;
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_properties
    this.#dbPromise = getDuckDB(location, dbMode, dbCallback);
  }

  async open() {
    this.#db = await this.#dbPromise;
    await this.#ensure_structure();
    return this;
  }
  close() {
    this.#db.close();
  }
  
  // https://sqlite.org/datatype3.html
  #ensure_structure() {
    console.log(`this.#db ===`, this.#db);
    this.#db.run(`
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
    this.#db.run(`EXPORT DATABASE '/tmp/rdfdb_schema_dump' (FORMAT 'json');`);
  }

  /*
https://rdf.js.org/stream-spec/#stream-interface
    
[Exposed=(Window,Worker)]
interface Stream : EventEmitter {
  any read();
  attribute Event readable;
  attribute Event end;
  attribute Event error;
  attribute Event data;
  attribute Event prefix;
};

   */
  read() {
  }



  /*
https://rdf.js.org/stream-spec/#source-interface
    
[Exposed=(Window,Worker)]
interface Source {
  constructor();
  constructor(ConstructorOptions options);
  Stream match(optional Term? subject, optional Term? predicate, optional Term? _object, optional Term? graph);
};


A Source is an object that emits quads. It can contain quads but also generate them on the fly. For example, parsers and transformations which generate quads can implement the Source interface.

match() Returns a stream of Quads that processes all quads matching the pattern.

When matching with graph set to undefined or null it MUST match all the graphs (sometimes called the union graph). To match only the default graph set graph to a DefaultGraph
  */
  match(subject, predicate, _object, graph) {
    const whereClauses = [];
    let params = [];

    if (subject) {
      whereClauses.push('subject = ?');
      params.push(subject.value);
    }
    if (predicate) {
      whereClauses.push('predicate = ?');
      params.push(predicate.value);
    }
    if (_object) {
      whereClauses.push('object = ?');
      params.push(_object.value);
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

    const quargs = [query];
    if (params.length) {
      quargs.push(params);
    }
    console.log({quargs});

    this.#db.each(
      ...quargs,
      (err, row) => {
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


  /*

    [Exposed=(Window,Worker)]
interface Sink {
  constructor();
  constructor(ConstructorOptions options);
  EventEmitter import(Stream stream);
};
A Sink is an object that consumes data from different kinds of streams. It can store the content of the stream or do some further processing. For example parsers, serializers, transformations and stores can implement the Sink interface.

import() Consumes the given stream. The end and error events are used like described in the Stream interface. Depending on the use case, subtypes of EventEmitter or Stream are used.


  */
  import(stream) {
    //console.log({EventEmitter});
    const emitter = new EventEmitter();
    
    const insertQuad = this.#db.prepare(`
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




  /*
[Exposed=(Window,Worker)]
interface Store { // Extends Source and Sink
  constructor();
  constructor(ConstructorOptions options);
  EventEmitter remove(Stream stream);
  EventEmitter removeMatches(optional Term? subject, optional Term? predicate, optional Term? _object, optional Term? graph);
  EventEmitter deleteGraph((Term or DOMString) graph);
};
A Store is an object that usually used to persist quads. The interface allows removing quads, beside read and write access. The quads can be stored locally or remotely. Access to stores LDP or SPARQL endpoints can be implemented with a Store inteface.

remove() Removes all streamed Quads. The end and error events are used like described in the Stream interface.

removeMatches() All quads matching the pattern will be removed. The end and error events are used like described in the Stream interface.

deleteGraph() Deletes the given named graph. The end and error events are used like described in the Stream interface.

  */
  remove(stream) {
    const emitter = new EventEmitter();
    stream.on('data', async (quad) => {
      try {
        await this.#db.run(
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
    // throw new Error('remove(stream) not implemented');
  }

  removeMatches(subject, predicate, _object, graph) {
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
    if (_object) {
      whereClauses.push('object = ?');
      params.push(_object.value);
    }
    if (graph) {
      whereClauses.push('graph = ?');
      params.push(graph.value);
    }

    const whereClause = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';

    this.#db.run(`DELETE FROM quads ${whereClause};`, params, (err) => {
      if (err) {
        emitter.emit('error', err);
      } else {
        emitter.emit('end');
      }
    });

    return emitter;
  }

  deleteGraph(graph) {
    const emitter = new EventEmitter();

    const graphValue = typeof graph === 'string' ? graph : graph.value;

    this.#db.run(
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
