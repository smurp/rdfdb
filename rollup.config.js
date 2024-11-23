import resolve from '@rollup/plugin-node-resolve';
import alias from '@rollup/plugin-alias';
import replace from '@rollup/plugin-replace';
import commonjs from '@rollup/plugin-commonjs';

const isBrowser = process.env.BUILD_ENV === 'browser';

export default {
  input: 'src/index.js',
  output: {
    file: isBrowser ? 'dist/rdfdb.browser.js' : 'dist/rdfdb.node.js',
    format: 'esm',
    sourcemap: true,
  },
  external: isBrowser ? [] : ['duckdb', 'fs', 'path', 'os', 'crypto'],
  plugins: [
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    }),
    alias({
      entries: [
        {
          find: 'stream',
          replacement: isBrowser ? 'stream-browserify' : 'stream',
        },
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
    commonjs(), // Convert CommonJS to ES modules
  ],
};
