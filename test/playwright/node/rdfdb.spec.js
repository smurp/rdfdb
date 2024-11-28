import { test, expect } from '@playwright/test';
import { RDFDb, DataFactory } from '../../../dist/rdfdb.node.js';
import { Readable } from 'stream';

//const clog = console.log;
const clog = () => {};

test.describe('RDFDb Node.js Tests', () => {
  let rdfDb;
  const quad1 = DataFactory.quad(
    DataFactory.namedNode('http://example.org/subject1'),
    DataFactory.namedNode('http://example.org/predicate1'),
    DataFactory.namedNode('http://example.org/object1'),
    DataFactory.defaultGraph()
  );
  
  const quad2 = DataFactory.quad(
    DataFactory.namedNode('http://example.org/subject2'),
    DataFactory.namedNode('http://example.org/predicate2'),
    DataFactory.literal('A literal value'),
    DataFactory.defaultGraph()
  );
  
  const quad3 = DataFactory.quad(
    DataFactory.blankNode('b1'),
    DataFactory.namedNode('http://example.org/predicate3'),
    DataFactory.namedNode('http://example.org/object3'),
    DataFactory.namedNode('http://example.org/graph1')
  );

  test.beforeEach(async () => {
    //rdfDb = new RDFDb({ location: '/tmp/test-node.rdfdb', dataFactory: DataFactory });
    rdfDb = new RDFDb();
    await rdfDb.open();
    clog('RDFDb instance created in Node.js');
  });

  test.afterEach(async () => {
    rdfDb.close();
    clog('RDFDb instance closed');
  });

  test('should detect an initial size of 0', async () => {
    expect(await rdfDb.size).toEqual(0);
    clog('There should be initially, none');
  });

  test('should import quads into the database', async () => {
    await streamToPromise(rdfDb.import(Readable.from([quad1, quad2, quad3])));
    expect(await rdfDb.size).toEqual(3);
    clog('Quads imported into the database');
  });
  
  test('should query all quads', async () => {
    await streamToPromise(rdfDb.import(Readable.from([quad1, quad2, quad3])));
    expect(await rdfDb.size).toEqual(3);

    const matchStream = rdfDb.match();

    const quads = [];
    matchStream.on('data', (quad) => {
      clog(`test()`, { quad });
      quads.push(quadToString(quad));
    });

    matchStream.on('error', (err) => {
      console.error('Error in matchStream:', err);
    });

    await streamToPromise(matchStream);

    expect(quads.length).toBeGreaterThan(0);
    clog('Querying all quads:', quads);
  });

  test('should remove a specific quad', async () => {
    await streamToPromise(rdfDb.import(Readable.from([quad2])));
    expect(await rdfDb.size).toEqual(1);

    await streamToPromise(rdfDb.remove(Readable.from([quad2])));
    expect(await rdfDb.size).toEqual(0);
    
    clog('Quad removed');
  });

  test('should remove quads matching a pattern', async () => {
    await streamToPromise(rdfDb.import(Readable.from([quad1,quad2,quad3])));
    expect(await rdfDb.size).toEqual(3);
    await streamToPromise(rdfDb.removeMatches(
      null,
      DataFactory.namedNode('http://example.org/predicate2'),
      null,
      null
    ));
    expect(await rdfDb.size).toEqual(2);
    clog('Quads matching pattern removed');
  });

  test('should delete a graph', async () => {
    await streamToPromise(rdfDb.import(Readable.from([quad1,quad2,quad3])));
    expect(await rdfDb.size).toEqual(3);
    await streamToPromise(rdfDb.deleteGraph('http://example.org/graph1'));
    expect(await rdfDb.size).toEqual(2);
    clog('Graph deleted');
  });

  test('should measure insertion performance', async () => {
    test.setTimeout(30_000); // Override the timeout to 30 seconds

    const numQuads = 50000; // Specify the number of quads to insert
    const quads = [];

    // Generate the quads
    for (let i = 0; i < numQuads; i++) {
      quads.push(
        DataFactory.quad(
          DataFactory.namedNode(`http://example.org/subject${i}`),
          DataFactory.namedNode(`http://example.org/predicate${i}`),
          DataFactory.namedNode(`http://example.org/object${i}`),
          DataFactory.defaultGraph()
        )
      );
    }

    // Convert the quads array to a stream
    const quadStream = Readable.from(quads);

    const startTime = Date.now(); // Record the start time

    // Insert the quads
    await streamToPromise(rdfDb.import(quadStream));

    const endTime = Date.now(); // Record the end time
    const elapsedTimeInSeconds = (endTime - startTime) / 1000;
    const quadsPerSecond = numQuads / elapsedTimeInSeconds;

    console.log(`Inserted ${numQuads} quads in ${elapsedTimeInSeconds.toFixed(2)} seconds`);
    console.log(`Insertion rate: ${quadsPerSecond.toFixed(2)} quads/second`);

    // Assert that all quads were inserted
    expect(await rdfDb.size).toEqual(numQuads);
  });

});

function quadToString(quad) {
  const { subject, predicate, object, graph } = quad;
  return `${termToString(subject)} ${termToString(predicate)} ${termToString(object)} ${termToString(graph)}`;
}

function termToString(term) {
  switch (term.termType) {
    case 'NamedNode':
      return `<${term.value}>`;
    case 'BlankNode':
      return `_:${term.value}`;
    case 'Literal':
      return `"${term.value}"`;
    case 'DefaultGraph':
      return 'default graph';
    default:
      return term.value;
  }
}

function streamToPromise(stream) {
  return new Promise((resolve, reject) => {
    stream.on('end', resolve);
    stream.on('error', reject);
  });
}
