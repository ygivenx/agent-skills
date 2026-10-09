# Link Shortener: design

Status: draft for review. Nothing here is agreed yet.

## 1. What it is

A service that turns a long URL into a short code and redirects visitors. Codes are 7 characters long, drawn from 62 symbols, and expire after 365 days (see §2 D2).

## 2. Decisions and why

| # | Decision | Why |
|---|---|---|
| D1 | Random codes, not sequential ids. | Sequential ids let anyone enumerate every link (§3). |
| D2 | Links expire after 365 days. | Bounds storage and limits abuse. |
| D3 | One redirect per request, no analytics. | Keeps the first version small. |

## 3. Data model

One table, `links(code, target, created_at, expires_at)`. `code` is the primary key. A collision on insert retries with a new code, up to 5 times.

## 4. Rollout

### 4.1 Before enabling in an environment

1. The `links` table exists and the migration is applied.
2. A redirect for an expired code returns 410, not 404.
3. The abuse report address receives mail.

## 5. Assumptions made without the user (tweak these)

1. Anyone can create a link without logging in.
2. Targets are not checked against a blocklist.
3. Codes are case-sensitive.

## 6. Known gaps

- **Open creation invites abuse.** Anonymous creation has no rate limit yet.
- **A deleted target still redirects.** The service never checks that the target is alive.
- **Collision retries are unbounded in time.** Five tries are counted, but not timed.
