# corpus precision regressions

Real false-positive shapes found in the 122-repo corpus (ADR-0010). Each must
behave as annotated.

Illustrative tutorial path, parent dir absent — must NOT flag: `reducers/todos.js`.

MIME type that matches the path shape — must NOT flag: `application/x-amz-json-1.1`.

Real missing file whose parent dir exists — must flag: `src/missing.ts`.

Editor-local config the doc tells you to create — must NOT flag: `.vscode/launch.json`.

Inline undefined script — must flag: `npm run ghost-inline`.

Undefined script only in a shell fence — must NOT flag:

```sh
npm run ghost-fence
```

Imports (rule is opt-in):

```ts
import _ from 'lodash';
import x from 'ghost-pkg';
import d from 'https://esm.sh/ky';
```
