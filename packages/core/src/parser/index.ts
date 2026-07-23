import { createHash } from 'node:crypto';

import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import type { Suppression } from '../domain/types.js';
import type { Root, RootContent } from 'mdast';

export interface DocFile {
  /** Workspace-relative posix path. */
  path: string;
  contentHash: string;
  ast: Root;
  directives: Suppression[];
}

const processor = unified().use(remarkParse).use(remarkGfm);

// <!-- driftlint-ignore[-next-line|-file] [ruleId...] [-- reason] -->  (ADR-0009)
const DIRECTIVE_RE = /^driftlint-ignore(-next-line|-file)?\b\s*(.*)$/s;

interface ParsedDirective {
  kind: 'next' | 'file';
  ruleIds: ReadonlySet<string> | null;
}

function parseDirective(commentValue: string): ParsedDirective | null {
  const inner = commentValue.replace(/^<!--/, '').replace(/-->$/, '').trim();
  const match = DIRECTIVE_RE.exec(inner);
  if (!match) return null;

  const kind = match[1] === '-file' ? 'file' : 'next';
  const beforeReason = (match[2] ?? '').split('--')[0]?.trim() ?? '';
  const ids = beforeReason.split(/\s+/).filter(Boolean);
  return { kind, ruleIds: ids.length > 0 ? new Set(ids) : null };
}

// Top-level directives only in v1; a directive nested inside a list item is not
// resolved to a sibling block. Documented limitation (TD-009 scope).
function collectDirectives(ast: Root): Suppression[] {
  const directives: Suppression[] = [];
  const children: RootContent[] = ast.children;
  children.forEach((node, i) => {
    if (node.type !== 'html') return;
    const parsed = parseDirective(node.value);
    if (!parsed) return;
    if (parsed.kind === 'file') {
      directives.push({ kind: 'file', ruleIds: parsed.ruleIds, range: null });
      return;
    }
    // next-line targets the following block's line span, tolerating blank lines.
    const next = children[i + 1]?.position;
    const fallback = (node.position?.start.line ?? 0) + 1;
    const start = next?.start.line ?? fallback;
    const end = next?.end.line ?? start;
    directives.push({ kind: 'next', ruleIds: parsed.ruleIds, range: { start, end } });
  });
  return directives;
}

export function parseDoc(path: string, content: string): DocFile {
  const ast = processor.parse(content) as Root;
  const contentHash = createHash('sha256').update(content).digest('hex');
  return { path, contentHash, ast, directives: collectDirectives(ast) };
}
