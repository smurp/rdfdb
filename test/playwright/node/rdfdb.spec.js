import { test, expect } from '@playwright/test';
import { RDFDb, DataFactory } from '../../../dist/rdfdb.node.js';
import { Readable } from 'stream';

test.describe('RDFDb Node.js Tests', () => {
  let rdfDb;

  test.beforeAll(async () => {
    rdfDb = new RDFDb({ location: '/tmp/test-node.rdfdb', dataFactory: DataFactory });
    //rdfDb = new RDFDb();
    await rdfDb.open();
    console.log('RDFDb instance created in Node.js');
  });

  test.afterAll(async () => {
    //rdfDb.connection.close();
    rdfDb.close();
    console.log('RDFDb instance closed');
  });

  test('should import quads into the database', async () => {
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

    const quadStream = Readable.from([quad1, quad2, quad3]);
    const importEmitter = rdfDb.import(quadStream);

    await new Promise((resolve, reject) => {
      importEmitter.on('end', resolve);
      importEmitter.on('error', reject);
    });

    //console.log('Quads imported into the database');
  });

  test('should query all quads', async () => {
    const matchStream = rdfDb.match();

    const quads = [];
    matchStream.on('data', (quad) => {
      quads.push(quadToString(quad));
    });

    await streamToPromise(matchStream);

    expect(quads.length).toBeGreaterThan(0);
    //console.log('Querying all quads:', quads);
  });

  test('should remove a specific quad', async () => {
    const quad = DataFactory.quad(
      DataFactory.namedNode('http://example.org/subject1'),
      DataFactory.namedNode('http://example.org/predicate1'),
      DataFactory.namedNode('http://example.org/object1'),
      DataFactory.defaultGraph()
    );

    const removeStream = Readable.from([quad]);
    const removeEmitter = rdfDb.remove(removeStream);

    await new Promise((resolve, reject) => {
      removeEmitter.on('end', resolve);
      removeEmitter.on('error', reject);
    });

    //console.log('Quad removed');
  });

  test('should remove quads matching a pattern', async () => {
    const removeMatchesEmitter = rdfDb.removeMatches(
      null,
      DataFactory.namedNode('http://example.org/predicate2'),
      null,
      null
    );

    await new Promise((resolve, reject) => {
      removeMatchesEmitter.on('end', resolve);
      removeMatchesEmitter.on('error', reject);
    });

    //console.log('Quads matching pattern removed');
  });

  test('should delete a graph', async () => {
    const deleteGraphEmitter = rdfDb.deleteGraph('http://example.org/graph1');

    await new Promise((resolve, reject) => {
      deleteGraphEmitter.on('end', resolve);
      deleteGraphEmitter.on('error', reject);
    });

    //console.log('Graph deleted');
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
