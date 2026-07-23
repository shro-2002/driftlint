#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { createDriftlint, github, json, pretty } from '@driftlint/core';

import type { Config, RunResult } from '@driftlint/core';

// Thin adapter (ADR-0001): arg parsing, reporter selection, exit codes. No
// verification logic. A real arg parser (citty) arrives later (TD-010).
const REPORTERS: Record<string, (r: RunResult) => string> = { pretty, json, github };

interface Args {
  path: string;
  reporter: string;
  configPath: string | undefined;
}

function parseArgs(argv: string[]): Args {
  let reporter = 'pretty';
  let configPath: string | undefined;
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--json') reporter = 'json';
    else if (arg === '--reporter') reporter = argv[++i] ?? reporter;
    else if (arg === '--config') configPath = argv[++i];
    else if (arg && !arg.startsWith('--')) positional.push(arg);
  }

  return {
    path: positional[0] ? resolve(positional[0]) : process.cwd(),
    reporter,
    configPath,
  };
}

async function loadConfigOverrides(path: string | undefined): Promise<Partial<Config> | undefined> {
  if (!path) return undefined;
  // Explicit --config path only; auto-discovery + zod validation is TD-007.
  return JSON.parse(await readFile(resolve(path), 'utf8')) as Partial<Config>;
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  const command = argv[0] ?? 'check';

  if (command !== 'check') {
    process.stderr.write(
      `Unknown command: ${command}\nUsage: driftlint check [path] [--reporter pretty|json|github] [--config <file>]\n`,
    );
    return 2;
  }

  const args = parseArgs(argv.slice(1));
  const render = REPORTERS[args.reporter];
  if (!render) {
    process.stderr.write(`Unknown reporter: ${args.reporter} (pretty|json|github)\n`);
    return 2;
  }

  try {
    const config = await loadConfigOverrides(args.configPath);
    const driftlint = await createDriftlint(
      config ? { cwd: args.path, config } : { cwd: args.path },
    );
    const result = await driftlint.run();
    const out = render(result);
    if (out) process.stdout.write(`${out}\n`);
    return result.findings.some((f) => f.severity === 'error') ? 1 : 0;
  } catch (err) {
    process.stderr.write(`driftlint: ${(err as Error).message}\n`);
    return 2;
  }
}

main().then(
  (code) => process.exit(code),
  (err: unknown) => {
    process.stderr.write(`driftlint: ${(err as Error).message}\n`);
    process.exit(2);
  },
);
