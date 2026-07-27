# Engineering audit — 2026-07 (evidence-based)

**Premise (Eric):** AI builds fast; an unregulated process compounds into a large pile of bad code
unless safety rails + self-healing keep it in check. Target bar: a pipeline that **safely deploys to
production with no human involvement**, no fear of regression, because the harnesses catch it.

Every finding below is measured from this repo today, ranked by risk to that bar. Each has a
prescriptive fix; the closing sections distill them into **instruction files** and **agent files**.

---

## 1 · Process/tooling gaps (the zero-human-deploy bar)

Current pipeline: typecheck → biome lint → unit tests → squash-merge → semantic-release → `fly deploy`.
Good spine — but it deploys to prod with these holes:

| # | Gap (evidence) | Risk | Fix |
|---|---|---|---|
| P1 | **No post-deploy verification.** `deploy.yml` runs `flyctl deploy` and stops — no health check, no smoke test, no auto-rollback. A green build that crashes on boot ships and stays shipped. | HIGH | Add a smoke step after deploy: curl `/login` + `/pulse` expect 200; on failure `flyctl releases rollback`. |
| P2 | **No browser/e2e tests in CI.** Playwright exists (`shoot:login`) but is manual-only. The login page — 2,893 lines whose inline JS breaks with a single bad escape (the `\n` bug this week proved it) — ships on unit tests that never execute that JS. | HIGH | CI job: launch offline server, Playwright asserts login boots with zero console errors + auth form reachable; assert board/leaderboard render. Artifacts: screenshots. |
| P3 | **No coverage measurement or ratchet.** No coverage config at all; 30 of 89 src files have no spec (all of `ports/`, `adapters/`, `bots/`, `personas/registry`, `feedback-service`…). | HIGH | Turn on rstest coverage; record baseline; CI fails only on *decrease* (ratchet, never a flat gate). |
| P4 | **No dependency/security scanning.** No dependabot, no `npm audit` in CI, no CodeQL, no secret-scanning config. Financial-adjacent app + OAuth + tokens. | HIGH | dependabot.yml (weekly, grouped) + `npm audit --omit=dev --audit-level=high` in CI + enable GitHub secret scanning/CodeQL. |
| P5 | **Prod config drifts silently.** `fly.toml` env changes deploy without validation; no staging environment; observe→live flag is one typo away. | MED | A boot-time env validator (fail fast, loud) + a `fly.toml` schema check in CI. Staging app later. |
| P6 | **No rollback drill / release verification doc.** Rollback exists in Fly but is untested. | MED | Document + test `flyctl releases rollback` once; wire into P1. |
| P7 | **Workflow-touching PRs silently skip CI** (observed on #199: 0 checks, no signal). | LOW | A required "checks ran" status; at minimum note in ENGINEERING.md so it's expected. |

## 2 · Code & structure quality (measured)

| # | Finding (evidence) | Fix |
|---|---|---|
| C1 | **God-files.** `authenticator.ts` 2,893 lines (auth + a whole game engine in one TS template literal — untypecheckable, untestable, unlintable inner JS). `render-dashboard.ts` 1,566. `dashboard-server.ts` 713 (routing + HTML + services). | Decompose: extract the login canvas into real `.ts` modules with a build step that bundles → inline string. Routing table out of dashboard-server. Ratchet: no file may *grow* past its current size (architecture eval, ADR-0008 C). |
| C2 | **Triplicated design system.** `escapeHtml` defined 3×; the full CSS token block (`#0B0F14`, `--mono`, …) pasted in 3 files; 7 inline `<style>` blocks; 64 `var(--mono)` repetitions. Every new page re-pastes and drifts. | One `src/ui/` module: `tokens.css.ts`, `escapeHtml`, shared shell/chip/tile partials. This **is** the component-library seed (finding S1). |
| C3 | **No runtime input validation library.** OAuth callbacks, `/add`, `/feedback`, Alpaca responses all hand-parsed; `strict` TS stops at the process boundary. | Adopt zod at the boundaries only (env, HTTP bodies, broker responses). Fail loud with typed errors. |
| C4 | **Inline-JS-in-string is a recurring defect class.** TS1005/backtick/`\n` escapes have bitten ≥3 times; caught only by manual `node --check` runs this week. | CI step: extract every `<script>` from rendered pages, `node --check` each (5-line script — cheap, permanent). |
| C5 | **tsconfig is strict but not maximal.** Missing `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`. | Enable, fix fallout once, keep forever. |

## 3 · Systems-engineering gaps

| # | Finding | Fix |
|---|---|---|
| S1 | **Custom code creates more custom code.** Each new view/page is bespoke string-building that re-invents shell, nav, tiles, chips (C2 is the measurement). There is no component system, so marginal cost never falls. | Component library: typed render functions (`tile()`, `chip()`, `shell()` exist in one file today — *promote them* to `src/ui/` and forbid new inline copies via a lint rule/grep check in CI). |
| S2 | **No decomposition pressure.** Systems grow monolithic; Graphify flags split-candidates but nothing acts on it. | ADR-0008 §C architecture eval (accepted): thresholds on file size/cohesion/fan-in → CI warning → ratchet. Build it. |
| S3 | **Docs/spec surfaces drift from reality** (was: Graphify 170 commits stale). | ADR-0008 §B parity check (accepted). Auto-refresh shipped; parity script next. |
| S4 | **Manual verification is tribal.** "shoot:login and eyeball it" lives in heads/CLAUDE.md, not in enforced process. | Codify as instruction files (below) + CI (P2). |

## 4 · Distillation → prescriptive instruction files

Granular, per-process, tightly scoped — each one page, imperative, checkable. Proposed set under
`docs/process/` (referenced from CLAUDE.md; enforced by CI where mechanizable):

- **`SHIP.md`** — the only allowed path to prod: branch → small PR → green (typecheck, lint, unit,
  e2e-smoke, coverage-ratchet, audit) → squash → release → deploy → **post-deploy smoke → rollback on fail**.
- **`INLINE-UI.md`** — rules for HTML-in-TS: no backticks/`${}` in inline JS; every page's scripts pass
  `node --check` in CI; all styles import from `src/ui/tokens`; `escapeHtml` only from `src/ui`.
- **`NEW-VIEW.md`** — adding a route/view: use `shell()`/components, register in the route table, add a
  render spec + an e2e assertion + a SYSTEM-MAP entry. No copy-paste of style blocks.
- **`NEW-SYSTEM.md`** — when code doesn't fit an existing system: name it, add to SYSTEM-MAP + diagram,
  parity check must pass (ADR-0008).
- **`DECOMPOSE.md`** — when the architecture eval flags a file/community: split playbook (extract →
  verify with graphify `affected` → ratchet threshold down).
- **`SECURITY.md`** — boundary validation (zod), secrets only via env/Fly, dependency-update cadence.

## 5 · Agent files (delegation)

Granular `.claude/agents/*` so routine enforcement doesn't spend Eric's attention — each agent has one
job, tight tools, and a prescriptive instruction file to follow:

- **`auditor`** — read-only; runs the checks in this doc quarterly; emits a delta report vs. this baseline.
- **`decomposer`** — picks the top architecture-eval flag; performs one `DECOMPOSE.md` split per PR.
- **`test-backfiller`** — picks one untested src file (the 30-file list), writes behavioral specs; raises
  the coverage baseline.
- **`ui-librarian`** — hunts C2-class duplication; migrates one inline copy to `src/ui/` per PR.
- **`dep-warden`** — reviews dependabot PRs: reads changelogs, runs the suite, merges patch/minor on
  green, escalates majors.
- **`release-verifier`** — post-deploy: runs the smoke, screenshots prod, rolls back + files an issue on failure.

## Sequenced remediation (leverage order)

1. **P1 post-deploy smoke + rollback** (closes the scariest hole; ~1 PR)
2. **P2 e2e smoke in CI** + **C4 script-syntax check** (kills the recurring defect class)
3. **P4 dependabot + audit + secret scanning** (one PR)
4. **P3 coverage ratchet** → then `test-backfiller` chips at the 30 files
5. **C2/S1 `src/ui/` component seed** → then `ui-librarian` migrates
6. **S2 architecture eval** (ADR-0008 C) → then `decomposer` chips at C1
7. Instruction files land with each of the above (the process is the deliverable)

*Baseline recorded 2026-07-27. The auditor agent re-measures against this file.*
