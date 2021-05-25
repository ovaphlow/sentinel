import babel from '@rollup/plugin-babel';

export default [
  {
    input: 'src/sign-up.jsx',
    output: {
      dir: 'dist',
      format: 'es',
    },
    plugins: [babel({ babelHelpers: 'bundled' })],
  },
  {
    input: 'src/sign-in.jsx',
    output: {
      dir: 'dist',
      format: 'es',
    },
    plugins: [babel({ babelHelpers: 'bundled' })],
  },
];
