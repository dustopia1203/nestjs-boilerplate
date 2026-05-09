// @ts-check
import eslint from '@eslint/js';
import eslintComments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import prettierConfig from 'eslint-config-prettier';
import importX from 'eslint-plugin-import-x';
import jsdoc from 'eslint-plugin-jsdoc';
import noSecrets from 'eslint-plugin-no-secrets';
import securityPlugin from 'eslint-plugin-security';
import tsdoc from 'eslint-plugin-tsdoc';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**', '*.config.js'],
  },

  // Base + TypeScript strict type-checked
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // Plugin presets
  jsdoc.configs['flat/recommended-typescript-error'],
  securityPlugin.configs.recommended,
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  unicorn.configs.recommended,
  eslintComments.recommended,

  // Project-wide settings + custom rules
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.jest },
      parserOptions: {
        projectService: {
          allowDefaultProject: ['eslint.config.mjs', 'commitlint.config.mjs'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      'import-x/resolver': {
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
    plugins: {
      tsdoc,
      'no-secrets': noSecrets,
    },
    rules: {
      // ---- Strict JSDoc ----
      'jsdoc/require-jsdoc': [
        'error',
        {
          publicOnly: false,
          require: {
            ArrowFunctionExpression: true,
            ClassDeclaration: true,
            ClassExpression: true,
            FunctionDeclaration: true,
            FunctionExpression: true,
            MethodDefinition: true,
          },
          contexts: [
            'TSInterfaceDeclaration',
            'TSTypeAliasDeclaration',
            'TSEnumDeclaration',
            'TSMethodSignature',
            'TSPropertySignature',
          ],
          checkConstructors: true,
          checkGetters: true,
          checkSetters: true,
        },
      ],
      'jsdoc/require-description': 'error',
      'jsdoc/require-param': 'error',
      'jsdoc/require-param-description': 'error',
      'jsdoc/require-param-type': 'off',
      'jsdoc/require-returns': 'error',
      'jsdoc/require-returns-description': 'error',
      'jsdoc/require-returns-type': 'off',
      'jsdoc/check-types': 'off',
      'jsdoc/check-tag-names': ['error', { typed: true }],
      'jsdoc/check-alignment': 'error',
      'jsdoc/no-undefined-types': 'off',
      'jsdoc/tag-lines': ['error', 'any', { startLines: 1 }],
      'tsdoc/syntax': 'error',

      // ---- Security ----
      'security/detect-object-injection': 'warn',
      'no-secrets/no-secrets': ['error', { tolerance: 4.5 }],

      // ---- Import hygiene ----
      'import-x/order': [
        'error',
        {
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        },
      ],
      'import-x/no-cycle': 'error',
      'import-x/no-default-export': 'off',
      'import-x/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './src/domain',
              from: ['./src/application', './src/infrastructure', './src/presentation'],
              message:
                'domain/** must not depend on outer layers (application, infrastructure, presentation).',
            },
            {
              target: './src/domain',
              from: './node_modules/@nestjs',
              message:
                'domain/** must remain pure TypeScript — no NestJS framework imports allowed.',
            },
            {
              target: './src/application',
              from: ['./src/infrastructure', './src/presentation'],
              message:
                'application/** must not depend on infrastructure/** or presentation/**.',
            },
            {
              target: './src/infrastructure',
              from: './src/presentation',
              message: 'infrastructure/** must not depend on presentation/**.',
            },
            {
              target: './src/presentation',
              from: ['./src/domain', './src/infrastructure'],
              message:
                'presentation/** must depend only on application/** (not domain/** or infrastructure/**).',
            },
          ],
        },
      ],

      // ---- Unicorn tweaks ----
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/no-null': 'off',
      'unicorn/prefer-module': 'off',
      'unicorn/filename-case': ['error', { case: 'kebabCase', ignore: [/\.spec\.ts$/] }],

      // ---- ESLint comments ----
      '@eslint-community/eslint-comments/require-description': ['error', { ignore: [] }],

      // ---- TS niceties ----
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      // NestJS modules/services/controllers use decorator-only classes
      '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
      // noUncheckedIndexedAccess requires bracket notation on process.env
      '@typescript-eslint/dot-notation': 'off',
    },
  },

  // Override: src/main.ts — bootstrap pattern uses void
  {
    files: ['src/main.ts'],
    rules: {
      'unicorn/prefer-top-level-await': 'off',
    },
  },

  // Override: tests — relax JSDoc and a few security rules
  {
    files: ['**/*.spec.ts', '**/*.e2e-spec.ts', 'test/**/*.ts'],
    rules: {
      'jsdoc/require-jsdoc': 'off',
      'jsdoc/require-description': 'off',
      'jsdoc/require-param': 'off',
      'jsdoc/require-returns': 'off',
      'tsdoc/syntax': 'off',
      'security/detect-object-injection': 'off',
      'no-secrets/no-secrets': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-magic-numbers': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },

  // Override: config files — don't require JSDoc on config exports, relax import checks
  {
    files: ['**/*.config.{ts,mjs,js}', 'eslint.config.mjs', 'commitlint.config.mjs'],
    rules: {
      'jsdoc/require-jsdoc': 'off',
      'tsdoc/syntax': 'off',
      'import-x/no-default-export': 'off',
      'import-x/no-named-as-default': 'off',
      'import-x/no-named-as-default-member': 'off',
      '@typescript-eslint/no-deprecated': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },

  // Override: composition root — exempt from layer dependency rule
  {
    files: ['src/main.ts', 'src/app.module.ts'],
    rules: {
      'import-x/no-restricted-paths': 'off',
    },
  },

  // MUST be last — disables stylistic rules in favor of Prettier
  prettierConfig,
);
