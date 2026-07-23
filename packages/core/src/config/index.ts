import type { Config } from '../domain/types.js';

// Config-file loading + zod validation is deferred to a later milestone (TD-007).
// The engine already reads severities from here, so the seam is in place.
export const DEFAULT_CONFIG: Config = {
  include: ['**/*.md', '**/*.mdx'],
  exclude: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/.git/**'],
  rules: {
    'file-path-exists': 'error',
    'npm-script-exists': 'error',
    // Opt-in: high false-positive rate on public READMEs (ADR-0010). Enable for
    // internal docs that should only import declared dependencies.
    'import-path-resolves': 'off',
  },
};

export function loadConfig(overrides?: Partial<Config>): Config {
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    rules: { ...DEFAULT_CONFIG.rules, ...(overrides?.rules ?? {}) },
  };
}
