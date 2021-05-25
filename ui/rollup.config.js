import babel from '@rollup/plugin-babel';

export default [
  {
    input: 'src/sign-up.js',
    output: {
      dir: 'dist',
      format: 'es',
    },
    plugins: [babel({ babelHelpers: 'bundled' })],
  },
  {
    input: 'src/sign-in.js',
    output: {
      dir: 'dist',
      format: 'es',
    },
    plugins: [babel({ babelHelpers: 'bundled' })],
  },
];
