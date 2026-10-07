# {{TITLE}} feature map

One file per product area. Each file says what exists, how mature it is, how a user reaches it, and how to drive it through `{{CLI}}` (the {{VERIFY_SKILL}} skill, at `.claude/skills/{{VERIFY_SKILL}}/{{CLI}}`). Use the map to answer questions without re-reading the whole codebase. Use the source to settle anything the map does not cover or that may have changed.

Scope: <!-- which directories and services this map covers, and what it deliberately leaves out -->

## Maturity rubric

Grade each sub-feature against the highest rung it fully meets. Every grade needs evidence (a file:line, a test name, or a `{{CLI}}` result).

| Grade | Meaning | Must be true |
|---|---|---|
| `deferred` | Out of scope by decision | Listed as deferred in CLAUDE.md or a plan, or no code and a doc says later |
| `stub` | Code exists but does not do the job | Endpoint crashes, a UI branch can never render, a field is never populated, or the only caller is dead code |
| `api-only` | Works, but no UI reaches it | Route works when called. Nothing in the frontend calls it from a reachable page |
| `beta` | A user can reach it and the happy path works | Reachable from the UI. A known defect, an untested path, or missing coverage keeps it from `stable` |
| `stable` | Safe to rely on | Reachable from the UI, covered by passing tests, no open known defect, and driven live in the local stack (`Live` column has a date) |

Rules:
- Grade what the code does, not what docs or commit messages claim.
- A known defect caps the grade at `beta`, however polished the rest is. Put the defect under Gotchas.
- Source-only review can propose `stable`, but only a live drive confirms it. Until then, write `beta (stable pending live)`.
- Role gating is part of the feature. If the UI shows a control that the API rejects for that role, it is a defect.
- Flags: a feature merged but off by default keeps its grade, and the row's `What` names the flag and its default. Code on an unmerged branch is not in the map; list it under "Unmerged" below.

## Deployed or not

Maturity describes the code at the commit in each file's `Last verified` line. Whether a deployed environment runs that code is a separate question. Each row has a `Since` column (the commit that introduced or last materially changed it). To answer "is this live on <env>?":

1. Run `{{CLI}} aws status` (read-only). It prints what each service runs and the commits on HEAD that the environment lacks.
2. If the row's `Since` commit is in that undeployed list, the environment runs the older behaviour.
3. If credentials are expired, say so and fall back to the snapshot below, with its date.

Snapshot (`aws status`, <YYYY-MM-DD>):
- <!-- what each environment runs, by short sha; nothing with account IDs, ARNs or internal hostnames if the repo is shared -->

## Unmerged

<!-- open PRs / branches whose code is NOT in the entries, with a one-line description each. Refresh with `{{CLI}} scope list`. -->

## Test evidence

"Tests pass" in this map means a local `{{CLI}} test` run at the file's `Last verified` commit. It does not mean CI is green. State here what CI actually does today (which workflows run tests, which have failed, which paths no CI touches).

## Baseline preconditions for driving

Every "Driving it" section assumes this, unless its own `Preconditions:` line says otherwise:

```bash
export {{ENVPREFIX}}_VERIFY_INSTANCE=<task>   # your own instance: the default is shared by every session in this checkout
CC=.claude/skills/{{VERIFY_SKILL}}/{{CLI}}
$CC doctor                 # tools, platform emulation, ports; if your instance is UP and you did not start it, pick another name
$CC stack up               # local copy of the deployment, waits for health
$CC seed                   # synthetic users / data only
```

## Driving conventions

- One labelled bullet per sub-feature: **sub-feature-id**: action → exact command → observable result. The result must be something a check can see: an HTTP status, a JSON field, visible text, a row count.
- Prefer the user's surface. Use the browser driver for UI features, the API driver for API-only ones, and read-only DB queries only to confirm state the UI does not show.
- Never change data with SQL. If a state can only be reached by editing the DB, that is a finding.
- Locators: prefer role+name. When the UI has no accessible name, note it under Gotchas and use the documented fallback.
- Role checks: run the same action as each role with the expected failure status, or check the UI hides the control.
- Paid or shared services (LLM, cloud) are never called by default. A paid probe runs only after the user agrees to the cost.
- Synthetic data only. Never put real identifiers in the map or in evidence.

## Proof and skip reporting

For each sub-feature you drive, record one line:

```
<sub-feature-id>  PASS|FAIL|SKIP  <evidence path or observed value>  <one-line reason if FAIL/SKIP>
```

Evidence lands in `$($CC evidence dir)`, per instance, and survives `cleanup` but not a reboot. A SKIP needs a reason ("needs a cloud workspace", "needs user approval for cost"). Never write PASS for something you only read about.

## Feature entry contract

Every feature file has this shape, in this order:

```markdown
# <Area name>

Last verified: <commit sha12> on <YYYY-MM-DD> (<source | live>)

<One paragraph: what the area is for, which roles use it, where it lives in the UI, overall maturity.>

## Sub-features

| ID | What it does | Maturity | Surface | Since | Live | Evidence |
|---|---|---|---|---|---|---|
| area-thing | ... | beta | UI+API | 8f2676b6 | 2026-10-05 / not driven | `path/router.py:42`, `tests/test_x.py::test_y` |

## How to get to it (user POV)

<Numbered steps from login, with on-screen labels in quotes.>

## Driving it

Preconditions: <baseline, plus anything else>

- **area-thing**: <action> → `{{CLI}} ...` → <observable result>

## Gotchas

- <defects, traps, things that look broken but are by design. Each with a file:line.>
```

Table rows have exactly 7 cells (`render-map` fails on any other count). `Surface` starts with `UI`, `API`, `WS` or `infra`. `Live` is `<date>`, `<date> FAIL`, or `not driven`. IDs are kebab-case, prefixed with the area, and stable. Rename only together with every reference in `multi-surface-journeys.md`. Areas with no UI (infra, runtime services) say "no user path" under How to get to it.

## Index

| File | Area | Roles | Overall (<YYYY-MM-DD>) |
|---|---|---|---|
| [example.md](example.md) | One-line scope | all | beta |

## Sweep order

Areas build on each other's data. Sweep in this order so each one starts with what it needs:

1. example

Run this after a feature change, or when a freshness check finds drift.
