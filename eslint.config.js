import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import jsonc from 'eslint-plugin-jsonc'
import pluginPrettier from 'eslint-plugin-prettier/recommended'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import pluginUnicorn from 'eslint-plugin-unicorn'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import vueParser from 'vue-eslint-parser'

const jsFiles = ['**/*.{js,jsx,mjs,cjs}']
const tsFiles = ['**/*.{ts,tsx,mts,cts}']
const vueFiles = ['**/*.vue']
const codeFiles = [...jsFiles, ...tsFiles, ...vueFiles]
const jsoncFiles = ['**/*.jsonc', '**/tsconfig.json', '**/tsconfig.*.json', '**/.vscode/*.json']
const unusedVarsOptions = {
  varsIgnorePattern: '^_',
  args: 'all',
  argsIgnorePattern: '^_',
  caughtErrors: 'all',
  caughtErrorsIgnorePattern: '^_',
}

export default defineConfig(
  globalIgnores([
    '**/node_modules/**',
    '**/out/**',
    '**/dist/**',
    '**/dist_electron/**',
    '**/coverage/**',
    'build/**',
    'release/**',
  ]),
  {
    name: 'piclist/code',
    files: codeFiles,
    extends: [js.configs.recommended],
    plugins: {
      'simple-import-sort': simpleImportSort,
      unicorn: pluginUnicorn,
    },
    rules: {
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/prefer-module': 'error',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      eqeqeq: 'error',
      'no-caller': 'error',
      'no-constant-condition': ['error', { checkLoops: false }],
      'no-eval': 'error',
      'no-extra-bind': 'error',
      'no-new-func': 'error',
      'no-new-wrappers': 'error',
      'no-throw-literal': 'error',
      'no-undef-init': 'error',
      'no-unused-vars': ['error', unusedVarsOptions],
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-const': 'error',
      'prefer-object-spread': 'error',
      'unicode-bom': ['error', 'never'],
      // Keep local and CI lint results consistent, regardless of NODE_ENV.
      'no-debugger': 'error',

      // Preserve the existing project's rule exceptions during this config refactor.
      'no-async-promise-executor': 'off',
      'no-case-declarations': 'off',
      'no-cond-assign': 'off',
      'no-control-regex': 'off',
      'no-empty': 'off',
      'no-extra-boolean-cast': 'off',
    },
  },
  {
    name: 'piclist/jsx',
    files: ['**/*.jsx'],
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    name: 'piclist/typescript',
    files: [...tsFiles, ...vueFiles],
    extends: [tseslint.configs.recommended, tseslint.configs.stylistic],
    rules: {
      // TypeScript checks undefined names; JavaScript keeps ESLint's no-undef rule.
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': ['error', unusedVarsOptions],

      // Compatibility with the existing application types and Electron integrations.
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
  {
    name: 'piclist/vue',
    files: vueFiles,
    extends: [pluginVue.configs['flat/recommended']],
    languageOptions: {
      // Vue must parse the SFC, delegating its script blocks to TypeScript.
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
      },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off',
    },
  },
  {
    name: 'piclist/node',
    files: ['src/main/**/*', 'src/preload/**/*', 'scripts/**/*', 'tests/**/*', '*.{js,mjs,cjs,ts,mts,cts}'],
    ignores: ['**/*.{json,jsonc,json5}'],
    languageOptions: {
      globals: globals.nodeBuiltin,
    },
  },
  {
    name: 'piclist/browser',
    // The isolated preload bridge can access both Node and the DOM.
    files: ['src/renderer/**/*', 'src/preload/**/*'],
    ignores: ['**/*.{json,jsonc,json5}'],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    name: 'piclist/explicit-esm',
    files: ['**/*.{mjs,mts}'],
    rules: {
      // TypeScript's Node declarations also expose these CommonJS-only globals.
      'no-restricted-globals': ['error', '__filename', '__dirname', 'require', 'module', 'exports'],
    },
  },
  {
    name: 'piclist/commonjs',
    files: ['**/*.{cjs,cts}'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: globals.node,
    },
    rules: {
      // electron-builder hooks and some tool configs are intentionally CommonJS.
      'unicorn/prefer-module': 'off',
    },
  },
  {
    name: 'piclist/json',
    files: ['**/*.json'],
    ignores: jsoncFiles,
    extends: [jsonc.configs['recommended-with-json'], jsonc.configs.prettier],
    language: 'jsonc/json',
  },
  {
    name: 'piclist/jsonc',
    files: jsoncFiles,
    extends: [jsonc.configs['recommended-with-jsonc'], jsonc.configs.prettier],
    language: 'jsonc/jsonc',
  },
  {
    name: 'piclist/json5',
    files: ['**/*.json5'],
    extends: [jsonc.configs['recommended-with-json5'], jsonc.configs.prettier],
    language: 'jsonc/json5',
  },
  {
    name: 'piclist/translations',
    files: ['src/renderer/i18n/**/*.json', 'src/main/i18n/locales/**/*.json'],
    rules: {
      'jsonc/sort-keys': ['error', 'asc', { caseSensitive: false, natural: true }],
    },
  },
  // Keep Prettier last so it can disable conflicting formatting rules.
  pluginPrettier,
)
