// configuracion de ESLint para el JS del juego. se corre con: npm run lint:js
import js from '@eslint/js';
import globals from 'globals';
import jsdoc from 'eslint-plugin-jsdoc';

export default [
  js.configs.recommended,
  jsdoc.configs['flat/recommended'],
  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
    },
    rules: {
      // solo let/const
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: 'error',
      // nombres significativos, x/y se permiten por ser coordenadas
      'id-length': ['error', { min: 2, exceptions: ['x', 'y'] }],
      // funciones cortas, una sola responsabilidad
      'max-lines-per-function': ['warn', { max: 30, skipBlankLines: true, skipComments: true }],
      // toda funcion lleva JSDoc
      'jsdoc/require-jsdoc': ['error', { require: { FunctionDeclaration: true, ArrowFunctionExpression: false } }],
      // propiedades como x, y o id se entienden solas
      'jsdoc/require-property-description': 'off',
    },
  },
];
