/** @type {import('stylelint').Config} */
module.exports = {
  // The Vue preset supplies postcss-html and Vue selector/function support.
  extends: ['stylelint-config-standard', 'stylelint-config-standard-vue'],
  rules: {
    // Preserve the project's color notation and existing component class names.
    'color-hex-length': 'long',
    // Tailwind's CSS imports use quoted paths, including package imports.
    'import-notation': 'string',
    'selector-class-pattern': null,
    // Scoped component styles intentionally group related selectors together.
    'no-descending-specificity': null,
    // Allow Tailwind v4 directives while still catching misspelled CSS at-rules.
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'apply',
          'config',
          'custom-variant',
          'plugin',
          'reference',
          'slot',
          'source',
          'theme',
          'utility',
          'variant',
        ],
      },
    ],
    'function-no-unknown': [
      true,
      {
        ignoreFunctions: ['--alpha', '--modifier', '--spacing', '--value', 'theme', 'v-bind'],
      },
    ],
    // Tailwind supplies the parent selector when expanding these blocks.
    'nesting-selector-no-missing-scoping-root': [true, { ignoreAtRules: ['custom-variant', 'utility'] }],
  },
  overrides: [
    {
      files: ['**/*.vue'],
      rules: {
        // Vue files may omit styles or reference a separate CSS file.
        'no-empty-source': null,
        // Tailwind and Vue resolve these values at build time.
        'declaration-property-value-no-unknown': [
          true,
          {
            ignoreProperties: {
              '/.*/': /(?:--(?:alpha|modifier|spacing|value)|theme|v-bind)\(/,
            },
          },
        ],
      },
    },
  ],
}
