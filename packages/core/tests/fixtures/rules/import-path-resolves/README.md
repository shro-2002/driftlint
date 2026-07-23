# import-path-resolves fixture

```ts
import _ from 'lodash'; // declared dependency, must not flag
import { readFile } from 'node:fs'; // builtin, must not flag
import own from 'import-fixture'; // own package name, must not flag
import y from './local'; // relative, skipped (no base dir)
import x from 'ghost-package'; // undeclared, must flag
```
