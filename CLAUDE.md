# agent-skills

A repo for sharing skills I already have and use, for Claude Code and Codex. It is not a place to develop new skills. Skills are copied in from `~/.agents/skills/` (or wherever they live) as they are, so keep them unchanged unless I ask otherwise. One self-contained folder per skill under `skills/<name>/` (`SKILL.md` plus its own `bin/`, `references/`, `templates/`). `install.sh` symlinks each into `~/.agents/skills/` and `~/.claude/skills/`.

## Layout

- `skills/<name>/SKILL.md`: required; frontmatter has `name` and `description`. The description says *when* to use the skill.
- `install.sh`: idempotent symlinker. It never overwrites an existing path that isn't a link to this repo.
- `README.md`: skills table, install and add-a-skill instructions.
- Skills: `explain-diff` and `project-verify-kit`. The latter's `bin/scaffold` is a `uv run --script` Python file, so it needs `uv`.

## Conventions

- Keep each skill self-contained. Don't reference files outside its folder.
- Frontmatter `name` must match the folder name.
- When adding or removing a skill, update the table in `README.md` and re-run `./install.sh`.
- For `project-verify-kit`, change `templates/` here. Copies in target repos are not auto-synced. `render-map` must stay identical across repos except for the `{{...}}` substitutions.
- Scripts: `#!/usr/bin/env bash` with `set -euo pipefail`, or `uv` inline-metadata Python. Make them executable.
- Don't commit `.DS_Store` or `__pycache__/` (already gitignored).

## Secrets: check before every commit

This repo may be public, and skills often contain example configs, so scan for secrets before every commit. Don't skip it, even for docs-only changes.

1. Stage the changes: `git add -A`.
2. Scan the staged changes: `gitleaks git --staged --redact -v`. (`gitleaks protect --staged` on older versions.)
3. For a full-history check, run `gitleaks git --redact -v`.
4. Commit only if the scan is clean. If it finds anything, unstage, remove the secret, and rotate it if it was ever real. Don't allowlist real credentials.
5. Also look through the diff for things gitleaks can miss: internal hostnames or account IDs, personal emails, tokens in example commands, and `.env` or key files.

Use placeholders in templates and examples (`<token>`, `acme`, `example.com`), never real values.

## Verify changes

- `bash -n install.sh` and `shellcheck install.sh` if available.
- `skills/project-verify-kit/bin/scaffold --help` should run.
- To test the scaffold, run it against a temp dir (`--repo "$(mktemp -d)"`), then run the generated `render-map`. It must exit 0.
