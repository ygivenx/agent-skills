# CLI contract for a project's verify CLI

Each project builds its own CLI (a single uv script or a package of modules, whichever fits). What they share, so a human or agent moving between projects already knows how to use them:

- **One entry point** in the verify skill directory, runnable from the repo root with `uv run` (no install step). `--help` on every command with examples.
- **Exit codes:** 0 pass, 1 check failed, 2 usage or precondition error whose message says how to fix it.
- **Echo** every command it runs on a `+` line.
- **Mirror the pipeline, don't copy it.** Read the real workflow files and IaC. A wiring/parity check fails when a pipeline step or deployed resource has no local counterpart and no explicit skip.
- **Instances:** `<PREFIX>_VERIFY_INSTANCE` / `--instance` names a run; state, containers and evidence are namespaced by it. `cleanup` touches only its own instance and labelled resources. Never touch other sessions' containers.
- **Evidence** in `/tmp/<name>-verify/<instance>/evidence/`, surviving `cleanup`, printed by `evidence dir`.
- **Read-only against real accounts:** `aws status` describes/lists only. Anything that writes to a real environment is listed under "Never without asking" and needs a named go-ahead.
- **Minimum command set:** `doctor`, `stack up|down|logs|restart|status`, `seed`, `api` (as a role, `--expect`, `--until`, `--field`, `--save`), `browser run|snapshot`, `db query` (read-only), `test`, `ci status`, `aws status`, `parity check`, `evidence dir|list`, `cleanup`, `report`.
- **Failure injection** for any external service the app calls (LLM, storage): a deterministic fake with modes such as `normal|empty|fail|garbage|slow`, plus a call counter.
- **Seed data is synthetic.** Never real identifiers.
