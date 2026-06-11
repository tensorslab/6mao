import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'

export default [
  {
    ignores: ['dist', 'out', 'release', 'node_modules']
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        __dirname: 'readonly',
        Buffer: 'readonly',
        process: 'readonly',
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        requestAnimationFrame: 'readonly',
        clearTimeout: 'readonly',
        setTimeout: 'readonly',
        URL: 'readonly',
        HTMLTextAreaElement: 'readonly',
        MouseEvent: 'readonly',
        HTMLElement: 'readonly',
        AbortController: 'readonly',
        TextDecoder: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-undef': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-unused-vars': 'off'
    }
  }
]
