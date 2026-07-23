import type { Rule } from '../domain/types.js';

export const npmScriptExists: Rule = {
  id: 'npm-script-exists',
  claimTypes: ['npm-script'],
  defaultSeverity: 'error',
  verify(claim, ctx) {
    if (ctx.index.scripts.has(claim.value)) return [];
    return [
      {
        ruleId: 'npm-script-exists',
        message: `npm script "${claim.value}" is not defined in any package.json in the workspace.`,
        claim,
      },
    ];
  },
};
