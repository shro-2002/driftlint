import { visit } from 'unist-util-visit';

import type { DocFile } from '../parser/index.js';
import type { Code, InlineCode } from 'mdast';

export interface InlineHit {
  value: string;
  line: number;
  column: number;
}

export interface BlockHit {
  value: string;
  lang: string;
  startLine: number;
}

export function eachInlineCode(doc: DocFile): InlineHit[] {
  const hits: InlineHit[] = [];
  visit(doc.ast, 'inlineCode', (node: InlineCode) => {
    const start = node.position?.start;
    hits.push({ value: node.value, line: start?.line ?? 1, column: start?.column ?? 1 });
  });
  return hits;
}

export function eachCodeBlock(doc: DocFile): BlockHit[] {
  const hits: BlockHit[] = [];
  visit(doc.ast, 'code', (node: Code) => {
    hits.push({
      value: node.value,
      lang: (node.lang ?? '').toLowerCase(),
      startLine: node.position?.start.line ?? 1,
    });
  });
  return hits;
}

/** Run a sticky/global regex over a block's lines, yielding capture group 1 with its doc location. */
export function scanBlockLines(
  block: BlockHit,
  regex: RegExp,
  onMatch: (captured: string, line: number, column: number) => void,
): void {
  const lines = block.value.split('\n');
  lines.forEach((text, i) => {
    regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      const captured = m[1];
      // Content lines start one below the opening fence.
      if (captured !== undefined) onMatch(captured, block.startLine + 1 + i, m.index + 1);
      if (m.index === regex.lastIndex) regex.lastIndex++;
    }
  });
}
