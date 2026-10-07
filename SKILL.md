---
name: project-verify-kit
description: Use when adding the verify-CLI + feature-map skill pair to a repo (a new project, or an existing one that lacks it), when asked to give a project an agent-runnable verification CLI and a graded feature map, or when updating the shared format across projects. Scaffolds `.claude/skills/verify-<name>` and `<name>-feature-map` with the common rubric, entry contract, render-map page, answer shape and report shape.
---

# project-verify-kit

A shared format for project verification, as a scaffold: every repo gets a verify CLI and a feature map in the same shape, so a human or agent moving between projects already knows how to verify one and how to answer "what exists, and does it work?". If a repo you can read already uses this format (`.claude/skills/verify-*` next to `*-feature-map`), treat it as the reference implementation and reuse its code.

Two skills per repo, committed in the repo so teammates and CI get them:

| skill | holds | project-specific part |
|---|---|---|
| `verify-<name>` | SKILL.md (mirrors table, launch, drive, CI parity, deploy parity, never-without-asking, evidence, cleanup, report shape) + the CLI | the CLI and the parity stack |
| `<name>-feature-map` | SKILL.md (answer shape, freshness check, maintain loop), `features/README.md` (rubric, entry contract, index), one file per area, `multi-surface-journeys.md`, `render-map` | the area files |

## Use

```bash
<this skill's base directory>/bin/scaffold --repo <repo root> --name <slug> --title "<Title>" --cli <cli-name> [--codex]
```

Then, in the repo:
1. Write the CLI to `references/cli-contract.md` (start from the minimum command set; reuse code from a reference implementation, if you have one).
2. Fill the `<!-- -->` blanks in `verify-<name>/SKILL.md` and `features/README.md` (scope, rubric extensions, deployed snapshot).
3. Add one `features/<area>.md` per product area, following the entry contract in the README. Build them with the Maintain loop in the map SKILL.md (parallel read-only subagents per area, then a live pass). Grade conservatively: `beta (stable pending live)` until driven.
4. `render-map` must exit 0; it rejects malformed table rows.
5. Add two lines to the repo's CLAUDE.md: use the map before answering product questions, use the CLI for verification.

## Changing the shared format

Edit `templates/` here, then port the change to each repo's copies by hand (copies are deliberately not auto-synced; projects extend the rubric and sections). `render-map` should stay identical across repos except for the `{{...}}` substitutions.
