
import {default as sqlite} from 'sqlite3';  // Is there a way to do this
var sqlite3 = sqlite.verbose(); // and this on without sqlite3Module?

export class RDFStarSQL {
  /*
https://rdf.js.org/stream-spec/#constructoroptions-interface
    
[Exposed=(Window,Worker)]
interface ConstructorOptions {
  attribute DataFactory? dataFactory;
  attribute DOMString? baseIRI;
  };
  */
  #db;
  constructor({dataFactory, baseIRI, location, dbMode, dbCallback}) {
    this.dataFactory = dataFactory;
    this.baseIRI = baseIRI;
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_properties
    this.#db = new sqlite3.Database(location, dbode, dbCallback);
    this.#ensure_structure();
  }

  // https://sqlite.org/datatype3.html
  #ensure_structure() {
    this.#db.run(`
      CREATE TABLE IF NOT EXISTS kv ();
    `);
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
    throw new Error('match(s,p,o,g) not implemented');
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
    throw new Error('import(stream) not implemented');
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
    throw new Error('remove(stream) not implemented');
  }

  removeMatches(subject, predicate, _object, graph) {
    throw new Error('removeMatches(s,p,o,g) not implemented');
  }

  deleteGraph(graph) {
    throw new Error('deleteGraph(graph) not implemented');
  }
  
}
