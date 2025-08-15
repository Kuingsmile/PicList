import eslint from '@eslint/js'
import standard from '@vue/eslint-config-standard'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import eslintPluginUnicorn from 'eslint-plugin-unicorn'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    files: ['./src/*.{ts,tsx,cts,mts,js,cjs,mjs}', './scripts/*.{ts,js,mjs}', './test/*.{ts,js,mjs}']
  },
  {
    ignores: ['**/node_modules/**', '**/out/**', '**/webpack.config.js', 'vitest.workspace.mjs', '**/dist/**']
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.stylistic,
  ...pluginVue.configs['flat/recommended'],
  ...standard,
  eslintPluginPrettierRecommended,
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
      unicorn: eslintPluginUnicorn
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error'
    }
  },
  {
    languageOptions: {
      parserOptions: {
        warnOnUnsupportedTypeScriptVersion: false
      },
      globals: {
        ...globals.node,
        ...globals.browser
      }
    }
  },
  {
    rules: {
      eqeqeq: 'error',
      'no-caller': 'error',
      'no-constant-condition': ['error', { checkLoops: false }],
      'no-eval': 'error',
      'no-extra-bind': 'error',
      'no-new-func': 'error',
      'no-new-wrappers': 'error',
      'no-throw-literal': 'error',
      'no-undef-init': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-const': 'error',
      'prefer-object-spread': 'error',
      'unicode-bom': ['error', 'never'],
      // Enabled in eslint:recommended, but not applicable here
      'no-extra-boolean-cast': 'off',
      'no-case-declarations': 'off',
      'no-cond-assign': 'off',
      'no-control-regex': 'off',
      'no-inner-declarations': 'off',
      'no-empty': 'off',

      // @typescript-eslint/eslint-plugin
      'no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/class-literal-property-style': 'off',
      '@typescript-eslint/consistent-indexed-object-style': 'off',
      '@typescript-eslint/consistent-generic-constructors': 'off',
      '@typescript-eslint/no-duplicate-enum-values': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off', // {} is a totally useful and valid type.
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      // Pending https://github.com/typescript-eslint/typescript-eslint/issues/4820
      '@typescript-eslint/prefer-optional-chain': 'off',
      'unicorn/prefer-node-protocol': 'error'
    }
  },
  {
    files: ['**/*.mjs', '**/*.mts'],
    rules: {
      // These globals don't exist outside of CJS files.
      'no-restricted-globals': [
        'error',
        { name: '__filename' },
        { name: '__dirname' },
        { name: 'require' },
        { name: 'module' },
        { name: 'exports' }
      ]
    }
  },
  {
    files: ['*.vue', '**/*.vue'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        parser: tseslint.parser
      }
    }
  }
)
