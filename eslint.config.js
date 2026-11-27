import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// Until @webtiles-viewer/eslint-plugin ships (webtiles#262), the one plugin rule enforced here is that src/ imports
// nothing from the host: only @webtiles-viewer/plugin-api (types and the tiny runtime) and your own files.
export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{ts,mjs,js}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: { globals: globals.browser },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^@webtiles-viewer/(?!plugin-api$)',
              message: 'A plugin sees WebTiles only through ctx and @webtiles-viewer/plugin-api.',
            },
            { regex: '^@webtiles-viewer/plugin-api/testing$', message: 'The /testing mock is for tests only.' },
          ],
        },
      ],
    },
  },
  {
    // Build scripts, config files and tests run under Node.
    files: ['scripts/**', 'test/**', '*.config.{ts,js}'],
    languageOptions: { globals: globals.node },
  },
])
