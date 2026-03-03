// ============================================================
// eslint.config.js — ESLint Flat Config (v9+)
// ============================================================

import js           from '@eslint/js'
import globals      from 'globals'
import reactHooks   from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint     from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([

  // ─── Ignorados globalmente ──────────────────────────────
  globalIgnores([
    'dist/**',
    'dist-ssr/**',
    'build/**',
    'node_modules/**',
    'public/**',
    'coverage/**',
    'playwright-report/**',
  ]),

  // ─── TypeScript + React (arquivos do src/) ──────────────
  {
    files: ['src/**/*.{ts,tsx}'],

    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],

    languageOptions: {
      ecmaVersion: 2022,
      globals:     globals.browser,
    },

    rules: {
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern:         '^_',
        varsIgnorePattern:         '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-explicit-any':         'error',
      '@typescript-eslint/no-non-null-assertion':   'warn',
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer:    'type-imports',
        fixStyle:  'inline-type-imports',
      }],

      'react-hooks/rules-of-hooks':  'error',
      'react-hooks/exhaustive-deps': 'warn',

      'no-console':       ['warn', { allow: ['warn', 'error'] }],
      'no-debugger':      'error',
      'prefer-const':     'error',
      'no-var':           'error',
      'object-shorthand': 'error',
      'prefer-template':  'error',
      'eqeqeq':           ['error', 'always'],
    },
  },
])