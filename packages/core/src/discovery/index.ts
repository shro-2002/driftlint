import fg from 'fast-glob';

import type { Config } from '../domain/types.js';

/** Return workspace-relative posix paths of doc files, sorted for determinism. */
export async function discoverDocs(root: string, config: Config): Promise<string[]> {
  const entries = await fg(config.include, {
    cwd: root,
    ignore: config.exclude,
    dot: false,
    onlyFiles: true,
  });
  return entries.sort();
}
