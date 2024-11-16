// rollup.config.js

import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';

const isProduction = process.env.NODE_ENV === 'production';
const isBrowser = process.env.BUILD_ENV === 'browser';

export default {
  input: 'src/index.ts', // Adjust the path to your entry file
  output: {
    file: isBrowser ? 'dist/rdfdb.browser.js' : 'dist/rdfdb.node.js',
    format: isBrowser ? 'umd' : 'cjs',
    name: 'RDFDb',
    sourcemap: true,
    globals: {
      'duckdb': 'duckdb',
      '@duckdb/duckdb-wasm': 'duckdb',
    },
  },
  external: isBrowser ? [] : ['duckdb', 'fs', 'path', 'os', 'crypto', 'events', 'stream'],
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'preventAssignment': true,
    }),
    resolve({
      browser: isBrowser,
      preferBuiltins: !isBrowser,
    }),
    commonjs(),
    typescript({
      tsconfigOverride: {
        compilerOptions: {
          module: 'ESNext',
          target: 'ES2015',
        },
      },
    }),
  ],
};
