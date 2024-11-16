// test-node.js

import { RDFDb } from './dist/rdfdb.node.js';

async function main() {
  const rdfDb = await RDFDb.create();
  console.log('RDFDb instance created in Node.js');
  // Perform additional tests here
}

main().catch(console.error);
