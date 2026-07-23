# packages/

pnpm workspace packages. Created during Phase 4, in this order:

| Package  | Surface                                | Depends on |
| -------- | -------------------------------------- | ---------- |
| `core`   | All product logic (no I/O assumptions) | —          |
| `cli`    | Command line                           | `core`     |
| `vscode` | VS Code extension                      | `core`     |
| `mcp`    | MCP server                             | `core`     |
| `action` | GitHub Action                          | `core`     |

Rules:

- `core` never imports from a sibling package.
- Surface packages contain only adapters: argument parsing, platform glue, I/O.
- Shared logic found in two surfaces moves to `core` immediately.
- Each package has its own `README.md`, `tsconfig.json` extending `/tsconfig.base.json`, and colocated tests.
