import { filePathExists } from './file-path-exists.js';
import { importPathResolves } from './import-path-resolves.js';
import { npmScriptExists } from './npm-script-exists.js';

import type { Rule } from '../domain/types.js';

// Rule Set v1 (ADR-0008). Plugin rules join this list via the loader later (ADR-0005).
export const builtinRules: Rule[] = [filePathExists, npmScriptExists, importPathResolves];
