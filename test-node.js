// test-node.js

import { RDFDb } from './dist/rdfdb.node.js';

import dataFactory from '@rdfjs/data-model'

async function main() {
  const rdfDb = await RDFDb.create('/tmp/test-node.rdfdb');
  console.log('RDFDb instance created in Node.js',
              {rdfDb});

  // Perform additional tests here
}

main().catch(console.error);
