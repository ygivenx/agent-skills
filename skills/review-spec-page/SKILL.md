---
name: review-spec-page
description: Use when asked to turn a markdown spec, design doc or RFC into an interactive HTML page for review, or when a long design needs a human to mark each decision, assumption and gap Keep / Change / Question and send the answers back. Produces one self-contained page with search, contents, folding, cross-reference links, a review drawer that exports Markdown, and optional explorers (state diagram, simulator) built from the spec's own numbers.
---

# review-spec-page

A spec is long and the reviewer's answers are scattered. This renders the markdown as one offline page where each decision, assumption and gap carries Keep / Change / Question buttons and a note, and a drawer exports the whole review as Markdown to paste back into the chat. The markdown stays the source of truth; re-render after every edit.

## Run it

```bash
SKILL=~/.agents/skills/review-spec-page   # or wherever this skill is linked
$SKILL/bin/render path/to/spec.md [--extras DIR] [--envs DEV,TEST,PROD] [--status "Draft"] [--open]
```

Needs `uv` only. Output is `spec.html` beside the spec (`--out` to move it). Never edit the HTML.

## What the spec needs

Items are found by heading, so a spec in this shape works with no config:

- **Decisions:** a table whose first column holds ids like `D1`, `R2`, `ADR3`. Any `D1` in the text becomes a link that previews the decision on hover.
- **Assumptions:** a section titled with "assum…"; its top-level list items.
- **Gaps:** a section titled "gaps", "limitations", "risks" or "open questions"; its top-level list items.
- **Checklist:** the first numbered list under a heading like "Before enabling" or "Rollout". `--envs` gives one tick box per environment; with none, one "Done" box.
- Numbered `## N. Title` headings give `§N` and `§N.M` links. Unnumbered headings still work, without `§` links.

If a section title doesn't match, rename it in the spec rather than adding config. Overrides exist in `window.SPEC_CONFIG.sections` (regexes) if you must.

## Explorers (optional, per spec)

Make a folder `spec-page/` next to the spec (or pass `--extras`) with:

- `widgets.html`: markup placed above the spec.
- `widgets.js` (or several `widgets*.js`): sets `window.SpecPage.extras = { prepare(), start() }`. `prepare` runs once items are found and before links are made, `start` after the page is built. Helpers available on `SpecPage`: `$`, `$$`, `esc`, `linkify(el)`, `go(id)`, `num(name, fallback)`, `defaults`.

`engine/page.css` already styles the usual pieces: `.explore` with tabs, `.chips` scenario buttons, an SVG state diagram (`.node`, `.edge`), a `.metrics` / `.budget` / `.trace` outcome panel, `.steps` accordions. See `examples/url-shortener/` for the smallest working extras.

Rules that made the first one good:

1. **Read numbers from the spec, don't copy them.** Parse the spec text (a limits paragraph, an env table) into `SpecPage.defaults` and read with `num()`. A changed default then changes the page on re-render, and a mismatch between the page and the spec can't hide.
2. **Check every rule against the code before drawing it.** An explorer that is wrong is worse than none. Where the spec and the code disagree, fix the spec and say so.
3. **Explain by scenario, not by legend.** Chips that replay a path, a simulator with presets (the common case, the cap hit, the failure), and a trace of who did what in order.
4. **Keep files under 500 lines.** Split the explorers into `widgets1.js`, `widgets2.js`… (all `widgets*.js` are concatenated in name order, each an IIFE sharing `window.SpecPage`).
5. **Synthetic data only** if the page may be shared.

## Working with the person

- A build like this takes a while. Give a short progress line every few steps, and answer "how long?" with a concrete estimate.
- After rendering, check it loads in headless Chrome without console errors and that the item count matches: `chrome --headless=new --dump-dom file://… | grep -c 'class="rv"'`.
- Review answers live in that browser's `localStorage`; you can't read them. Tell the reviewer to use **Copy as Markdown** or **Download .md** in the drawer, then act on the export: changes first, then questions.
- State what you changed in the spec while building (drift you found), and what is not committed.
