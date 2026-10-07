# agent-skills

My personal agent skills (Claude Code and Codex). One folder per skill under `skills/`; each is self-contained (its own `SKILL.md`, `bin/`, `references/`, `templates/`).

## Skills

| skill | what it does |
|---|---|
| [`project-verify-kit`](skills/project-verify-kit/SKILL.md) | Scaffolds a verify CLI skill + graded feature-map skill into any repo. Requires [`uv`](https://docs.astral.sh/uv/). |

## Install

```bash
git clone git@github.com:ygivenx/agent-skills.git ~/Programming/agent-skills
~/Programming/agent-skills/install.sh
```

`install.sh` symlinks every `skills/*` folder into `~/.agents/skills/` (Codex and others) and `~/.claude/skills/` (Claude Code). It is safe to re-run, and it skips any name that already exists and isn't a link to this repo. Update with `git pull`; new skills are linked by re-running the script.

## Adding a skill

Create `skills/<name>/SKILL.md` with `name` and `description` frontmatter, put any scripts/templates inside that folder, add a row to the table above, and re-run `install.sh`.
