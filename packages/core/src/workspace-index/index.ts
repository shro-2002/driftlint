import { builtinModules } from 'node:module';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import fg from 'fast-glob';

import type { FacetSet, FileFacet, WorkspaceIndex } from '../domain/types.js';

export interface IndexPlan {
  files: boolean;
  scripts: boolean;
  packages: boolean;
}

const NODE_BUILTINS = new Set<string>([
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
]);

function normalize(p: string): string {
  let s = p.replace(/\\/g, '/');
  if (s.startsWith('./')) s = s.slice(2);
  return s;
}

/** Reduce an import specifier to its package name: `@scope/pkg/sub` -> `@scope/pkg`, `pkg/sub` -> `pkg`. */
export function packageBase(spec: string): string {
  const s = spec.startsWith('node:') ? spec.slice(5) : spec;
  if (s.startsWith('@')) return s.split('/').slice(0, 2).join('/');
  return s.split('/')[0] ?? s;
}

// Queried-but-not-built is a bug (engine must plan facets from enabled rules),
// so surface it loudly rather than silently returning false.
function unbuilt(name: string): FacetSet {
  return {
    has(): boolean {
      throw new Error(`workspace-index facet "${name}" was queried but not built`);
    },
  };
}

function unbuiltFiles(): FileFacet {
  const base = unbuilt('files');
  return {
    has: base.has,
    hasDir() {
      throw new Error('workspace-index facet "files" was queried but not built');
    },
  };
}

/** Every ancestor directory of every file, as posix paths (root is implicit). */
function directorySet(files: Iterable<string>): Set<string> {
  const dirs = new Set<string>();
  for (const file of files) {
    const parts = file.split('/');
    for (let i = 1; i < parts.length; i++) dirs.add(parts.slice(0, i).join('/'));
  }
  return dirs;
}

async function readPackageJsons(root: string): Promise<Array<Record<string, unknown>>> {
  const files = await fg(['**/package.json'], {
    cwd: root,
    ignore: ['**/node_modules/**'],
    dot: false,
  });
  const parsed: Array<Record<string, unknown>> = [];
  for (const rel of files.sort()) {
    try {
      parsed.push(JSON.parse(await readFile(join(root, rel), 'utf8')) as Record<string, unknown>);
    } catch {
      // Unparseable package.json is skipped, not fatal.
    }
  }
  return parsed;
}

const DEP_FIELDS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
] as const;

export async function createIndex(root: string, plan: IndexPlan): Promise<WorkspaceIndex> {
  let files: FileFacet = unbuiltFiles();
  let scripts = unbuilt('scripts');
  let packages = unbuilt('packages');

  if (plan.files) {
    const entries = await fg(['**/*'], {
      cwd: root,
      ignore: ['**/node_modules/**', '**/.git/**'],
      dot: true,
      onlyFiles: true,
    });
    // Case-sensitive (Linux/CI semantics); cross-FS case-fold deferred (TD-008).
    const set = new Set(entries.map(normalize));
    const dirs = directorySet(set);
    files = {
      has: (p) => set.has(normalize(p)),
      hasDir: (d) => d === '' || d === '.' || dirs.has(normalize(d)),
    };
  }

  if (plan.scripts || plan.packages) {
    const pkgs = await readPackageJsons(root);

    if (plan.scripts) {
      const set = new Set<string>();
      for (const pkg of pkgs) {
        const s = pkg.scripts;
        if (s && typeof s === 'object') for (const k of Object.keys(s)) set.add(k);
      }
      scripts = { has: (name) => set.has(name) };
    }

    if (plan.packages) {
      const set = new Set<string>();
      for (const pkg of pkgs) {
        if (typeof pkg.name === 'string') set.add(pkg.name);
        for (const field of DEP_FIELDS) {
          const deps = pkg[field];
          if (deps && typeof deps === 'object') for (const k of Object.keys(deps)) set.add(k);
        }
      }
      packages = {
        has: (spec) => NODE_BUILTINS.has(spec) || set.has(packageBase(spec)),
      };
    }
  }

  return { files, scripts, packages };
}
