// rollup.config.js

import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import alias from '@rollup/plugin-alias';
import replace from '@rollup/plugin-replace';

const isBrowser = process.env.BUILD_ENV === 'browser';

export default {
  input: 'src/index.ts',
  output: {
    file: isBrowser ? 'dist/rdfdb.browser.js' : 'dist/rdfdb.node.js',
    format: 'esm', // Use 'esm' format for both builds
    sourcemap: true,
  },
  external: isBrowser
    ? []
    : ['duckdb', '@duckdb/duckdb-wasm', 'fs', 'path', 'os', 'crypto'],
  plugins: [
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    }),
    alias({
      entries: [
        {
          find: 'duckdb-platform',
          replacement: isBrowser ? './duckdb-browser.js' : './duckdb-node.js',
        },
      ],
    }),
    resolve({
      browser: isBrowser,
      preferBuiltins: !isBrowser,
    }),
    // Include commonjs plugin if needed
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
