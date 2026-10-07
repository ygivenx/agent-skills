# Multi-surface journeys

Last verified: <sha12> on <YYYY-MM-DD> (source)

A journey crosses areas, so it can fail where no single area file looks. Each one names the sub-feature IDs it touches, the invariant that must hold across areas, the last live result, and the commands to drive it. Use this file for questions like "what happens to X after Y" and for release smoke tests. Journeys run in the order below, and each assumes the state the one before it left.

| ID | Journey | Areas | Last live | Result |
|---|---|---|---|---|
| j-example | What the user does, start to end | area-a, area-b | not driven | not driven |

## j-example

Touches: `area-a-thing`, `area-b-thing`.

Invariants:
1. <a number or state that must agree across areas>

Drive:

```bash
# copy-pasteable, in order, one shell
```

Result (<date>): <PASS | PARTIAL | FAIL | SKIP, and why>
