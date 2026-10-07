---
name: {{VERIFY_SKILL}}
description: Use when verifying a {{TITLE}} change end to end, before or after deploying, when reproducing a deployed-only bug locally, when checking that CI, migrations or infrastructure code still pass, or when asked to test, smoke-test, QA or prove a feature works.
---

# Verify {{TITLE}}

All verification goes through one CLI, `{{CLI}}`, in this directory. It runs a local copy of the real deployment and gives a command for every check we use.

```bash
CC=.claude/skills/{{VERIFY_SKILL}}/{{CLI}}   # from the repo root
$CC --help ; $CC <command> --help            # every command has examples
```

**Core rule:** if `{{CLI}}` can run a check, run it that way. Do not hand-roll `curl`, `docker compose` or `psql` for something it covers. Commands echo what they run (`+` lines). Exit codes: 0 pass, 1 check failed, 2 usage or precondition error (the message says how to fix it).

The CLI contract every project's CLI follows is in the project-verify-kit skill (`references/cli-contract.md`). For what to drive per feature, read the {{MAP_SKILL}} skill.

## What it mirrors

<!-- table: deployed resource | local stand-in, one row per service, datastore, proxy, LLM/cloud service. The parity check must diff this against the IaC and exit 1 on drift. -->

## Launch

```bash
$CC doctor          # tools, platform emulation, ports, other sessions' containers (leave those alone)
$CC stack up        # build -> up -> migrate -> health
$CC seed            # synthetic data only
```

Name your instance before anything that mutates: `export {{ENVPREFIX}}_VERIFY_INSTANCE=<task>`. If `doctor` shows your instance UP and you did not start it, another session did: pick another name. Never `stack down` a stack you did not start.

## Drive

<!-- table: need | command. api as a role, browser flow, poll with --until, logs, db query (read-only), failure injection -->

## CI parity

<!-- table: CI job or practice | command -->

## Deployed-environment parity

<!-- read-only status command; deploy rehearsal if any; "Things local cannot reproduce" list to include in every report -->

## Never without asking

Never do any of these without the user's explicit go-ahead:
- push images, update services, run tasks in a real account;
- IaC `plan` or `apply` against the real workspace;
- paid probes (LLM, cloud);
- any SQL write;
- commits;
- any write against a deployed environment's app.

A go-ahead counts only if it names the action. "Do whatever you need" names nothing: ask, listing the exact actions. Approval for one action does not carry over to the next. Use synthetic data only.

## Evidence

`$CC evidence dir` is `/tmp/{{NAME}}-verify/<instance>/evidence/`. It holds test logs, screenshots, API captures and probe output. It survives `cleanup`. Cite these paths in the report.

## Cleanup

```bash
$CC cleanup            # removes only what this instance started; keeps evidence
```

Run cleanup after every session, including failed ones, unless the user is keeping the instance.

## Report shape

1. **Verdict**: PASS / FAIL / PARTIAL, with the commit, platform and instance.
2. **Checks**: a table of check | command | result | evidence path.
3. **Deployed-environment differences**: the cannot-reproduce list, plus anything specific to this change.
4. **Findings**: ranked blocker / should-fix / nit, each with a file:line.
5. **Needs the user**: approvals, expired credentials, decisions.

## Common mistakes

| Mistake | Instead |
|---|---|
| Writing a plan and calling it verification | Run the commands; report what they printed |
| "Unit tests pass" as proof of an LLM or cloud fix | Those tests mock the client. Drive it locally with failure injection, and probe for real only with approval |
| Fixing data with SQL to get unstuck | Find the UI or API path; report the gap |
| Forgetting cleanup after a failed run | `$CC cleanup` is always safe |

## Keeping this skill true

- New or renamed pipeline step: extend the parity/wiring check so an uncovered step fails.
- New failure mode found while verifying: add a probe spec or UI flow so it is repeatable.
- A documented command fails: fix the CLI, not the report.
