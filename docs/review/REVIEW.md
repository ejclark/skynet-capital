# Pre-merge review rules

**Read by:** the pre-merge reviewer, on every code PR, from the base commit, so a PR cannot change
its own rules. Docs-only PRs are not reviewed.

**Size:** 3,531 characters, held under 4,000 by `tests/arch/review-rules.spec.ts`.

Read the diff first, then the files it touches as they stand at the PR's head. Report what would go
wrong after merge, with a concrete failure: the input or state, and the wrong result. Zero findings
is a normal answer: a reviewer told to find gaps manufactures them.

## Report

Wrong results, crashes, broken contracts, regressions, a requirement the change claims and does not
meet, member copy that states something false. Ask three questions of every change:

1. For every check the diff adds or changes, name the signal it reads against the real effect it
   claims. Report it when the signal can be true while the effect is not.
2. For every read that feeds a verdict, say what it returns when it fails or its window holds no
   sample. Report it if that equals the all-clear answer.
3. When the diff adds a new way to close, park, label or exempt something, grep every reader of that
   state and say what each now sees.

## Do not report: CI already fails the PR

| Gate | Owns |
|---|---|
| `npm run typecheck` | types, missing imports, wrong signatures |
| `npm run lint` (Biome) | format, style, unused code |
| `npm test`, with the arch, dupe and dead scans | file size, duplication, dead exports |
| `npm run check` | the specs related to what changed |
| commitlint | the PR title |

Also not: naming, structure, test coverage, prose, debt, and any scenario that starts "a future
change might". A finding with no failure to name is taste, however confident it sounds.

## Severity

- **Important**: any wrong result a real input reaches, however narrow the path: money, a member's
  page, stored state, a lane's decision, a filed issue or comment. It needs a `file:line` inside a
  changed hunk and a concrete failure scenario. At most 5 per review. It holds merge until the
  author fixes it or declines it with a reason.
- **Nit**: no wrong result: words that mislead a reader, a comment the code no longer matches. At
  most 3; the rest are dropped. It never holds merge.
- An edge you are unsure anyone reaches is neither. Leave it out.

Give each finding one category: `correctness`, `contract`, `honesty`, `security`, `performance` or
`loop`.

## Suppressed categories

A category the weekly review of reviews found authors mostly decline. Plain code drops a finding in
one before it posts. A row needs its evidence, and a replay that keeps its score.

| Category | Paths | Since | Evidence |
|---|---|---|---|

None yet.

## Per-path notes

| Path | What is at stake |
|---|---|
| `src/trading/`, `src/options/`, `src/risk/`, `src/math/` | Money. Check each amount against the units and sign its type and docstring promise. |
| `src/server/`, `src/storage/`, `src/scripts/` | What a member reads, and the boot. A read can fail; say what the member sees when it does. |
| `app/src/` | Member copy is a contract: it says only what the code does, and `SIM`/`LIVE` stay honest (`docs/BRAND.md`). |
| `.github/workflows/`, `scripts/bots-*` | Production. Say what is live after each step fails or refuses. |
| `scripts/moneypenny/`, `.claude/workflows/` | Lanes that act unattended. An unknown must never read as an all-clear. |
| `CLAUDE.md`, `.claude/`, `.github/prompts/` | Every session obeys the words literally. A claim about code must hold at head. |
