import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

/**
 * Flat ESLint config.
 *
 * Layering, in order:
 *   1. Next.js core-web-vitals  - framework + accessibility + performance rules
 *   2. Next.js typescript       - typescript-eslint recommended, wired for Next
 *   3. Repository rules         - the conventions in .github/instructions/
 *   4. The design language      - the token rules of design-language.md
 *   5. eslint-config-prettier   - LAST, disables every stylistic rule so
 *                                 Prettier owns formatting without conflicts
 */
/**
 * The Mochi design language, enforced.
 *
 * Every rule here is written in .github/instructions/design-language.md. The
 * checks look inside `className`, both the string form and the strings passed
 * to `cn()` or interpolated in a template literal, because that is where an
 * off-system value actually reaches the browser.
 *
 * They cannot see a class name built at runtime from a variable. That case, and
 * the judgement calls (one primary button, the cute budget, the anti-slop list),
 * stay with the reviewer.
 *
 * To step outside a rule, say why on the line:
 *   // eslint-disable-next-line no-restricted-syntax -- the speech tail needs a
 *   // smaller corner on one side only.
 *
 * `no-restricted-syntax` options do NOT merge across config objects: the last
 * matching block wins outright. Every later block that sets the rule spreads
 * this list, or the design checks silently stop applying to those files.
 */
const DESIGN = {
  /** Matches a class name at a word start, after whitespace or a `sm:`/`hover:` prefix. */
  head: '(^|\\s|:)',
  /** Matches the end of a class name, allowing an `/70` opacity modifier. */
  tail: '([\\s/]|$)',
};

const designTokenSelectors = [
  {
    pattern: `(#[0-9a-fA-F]{3,8}|${DESIGN.head}(shadow|rounded|bg|text|border|fill|stroke|ring|outline|from|via|to)-\\[)`,
    message:
      'No raw hex and no arbitrary value in a className. Use a token from styles/globals.css. If the value you need does not exist, add the token and say why. See design-language.md rule 2.',
  },
  {
    pattern: `${DESIGN.head}(bg|text|border|fill|stroke|ring|decoration|outline|divide|accent|caret|from|via|to)-(black|white|slate|gray|grey|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(-\\d{2,3})?${DESIGN.tail}`,
    message:
      'That is a default Tailwind colour, not a Mochi one. Text and outlines use `ink` and `line`, never black, white or a grey. Fills use `paper`, `surface`, `sunken`, `brand` or a candy tone. See design-language.md rules 3 and 9.',
  },
  {
    pattern: `${DESIGN.head}text-(xs|sm|base|lg|xl|[2-9]xl)${DESIGN.tail}`,
    message:
      'Only six text sizes exist: `text-hero`, `text-title`, `text-heading`, `text-body`, `text-small`, `text-key`. See design-language.md > Type.',
  },
  {
    pattern: `${DESIGN.head}border(-[0148])?${DESIGN.tail}`,
    message:
      'Outlines are 2px: `border-2 border-line`. Never a 1px hairline, never 4px or more. See design-language.md rule 4.',
  },
  {
    pattern: `${DESIGN.head}shadow(-(2xs|xs|sm|md|lg|xl|2xl|inner|none))?${DESIGN.tail}`,
    message:
      'Shadows are hard and straight down: `shadow-mochi-sm`, `shadow-mochi`, `shadow-mochi-lg`. A blurred grey shadow is not part of this language. See design-language.md rule 5.',
  },
  {
    pattern: `${DESIGN.head}rounded-(none|xs|sm|md|lg|xl|[2-4]xl)${DESIGN.tail}`,
    message:
      'Radius follows the hierarchy: `rounded-input`, `rounded-card`, `rounded-sheet`, `rounded-pill`, `rounded-full`. See design-language.md rule 6.',
  },
].flatMap(({ pattern, message }) => [
  { selector: `JSXAttribute[name.name='className'] Literal[value=/${pattern}/]`, message },
  {
    selector: `JSXAttribute[name.name='className'] TemplateElement[value.raw=/${pattern}/]`,
    message,
  },
]);

export default defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    name: 'template/rules',
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      // Deterministic import order. Auto-fixable with `pnpm lint:fix`.
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // Unused code is dead weight; `_`-prefixed args are an explicit opt-out.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // `any` erases the guarantees the strict tsconfig is buying us.
      '@typescript-eslint/no-explicit-any': 'error',

      // Prefer `import type` so type-only imports are erased at compile time.
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // Server logs belong in a structured logger, not stdout noise.
      // `console.warn`/`console.error` stay allowed for genuine failures.
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Catch `==`, implicit globals and other classic footguns.
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-var': 'error',
      'prefer-const': 'error',
      'object-shorthand': ['error', 'always'],
    },
  },

  {
    name: 'template/config-and-scripts',
    files: ['*.config.{ts,mjs,js}', 'scripts/**', 'tests/**', '**/*.test.{ts,tsx}'],
    rules: {
      'no-console': 'off',
    },
  },

  {
    // The visual rules of .github/instructions/design-language.md. UI that
    // ignores the tokens is the fastest way for this product to stop looking
    // like the design system it is built on.
    name: 'template/design-language',
    files: ['app/**/*.tsx', 'components/**/*.tsx'],
    rules: {
      'no-restricted-syntax': ['error', ...designTokenSelectors],
    },
  },

  prettier,

  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'next-env.d.ts',
    'pnpm-lock.yaml',
    // The source design canvas and its vendored design-system bundle. Read as
    // reference, never built or shipped, and not ours to lint or reformat.
    'games/**',
  ]),
]);
