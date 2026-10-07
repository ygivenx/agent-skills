# project-verify-kit

An agent skill (Claude Code and Codex) that adds two skills to any repo:

- `verify-<name>`: how to launch, drive and verify the app with a project CLI. The CLI mirrors CI and deploy, and it never writes to a real environment without asking.
- `<name>-feature-map`: one graded entry per feature (what exists, how mature it is, its evidence, how a user reaches it, what is deployed), plus `render-map`, which turns the map into a single offline HTML page.

The kit gives you the format. Each project writes its own CLI against `references/cli-contract.md`.

## Install

Requires [`uv`](https://docs.astral.sh/uv/): `bin/scaffold` and `render-map` are `uv run --script` files.

```bash
# Claude Code only
git clone <this repo> ~/.claude/skills/project-verify-kit

# Claude Code and Codex: clone once, link for Claude
git clone <this repo> ~/.agents/skills/project-verify-kit
ln -s ~/.agents/skills/project-verify-kit ~/.claude/skills/project-verify-kit
```

Update with `git pull` in the clone.

## Use

Ask the agent to "add the verify kit to this repo" (it loads `SKILL.md`), or run the scaffold yourself:

```bash
~/.claude/skills/project-verify-kit/bin/scaffold --repo . --name acme --title "Acme" --cli acmectl --codex
```

This writes `.claude/skills/verify-acme/` and `.claude/skills/acme-feature-map/`, and refuses to overwrite existing files. `--codex` links both into `.agents/skills/`. Commit them so teammates and CI get them. `SKILL.md` lists the next steps.

## Changing the format

Edit `templates/` and open a PR. Repos that are already scaffolded keep their own copies on purpose, since projects extend the rubric, so you port a format change to each repo by hand.
