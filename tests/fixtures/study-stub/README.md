# Stub answers for a study round's dry run (#4943)

`scripts/study/round.mjs --dry-run` (and `drive.mjs --stub`) answer every sealed call from here:
`<role>/<n>.json` is the n-th call of that role in one process; past the last file, the last one
answers again (`scripts/study/sealed.mjs` → `stubPick`). Every answer is checked against the
role's schema in `scripts/study/schemas/`, as the real CLI would enforce it.

Canned, not clever: these prove the round's plumbing, never a finding. The words are generic;
the only area facts are fact-sheet ids the composed world itself serves.

- `sealed/` — a STAND-IN answer key (one made-up keyword, one made-up paragraph). Never the real
  key, which lives outside every repo and is read only through `round.mjs --sealed <dir>`.
- `task-author/1.json` is seeded bad on purpose: its second task carries the stand-in keyword, so
  the lint's feedback loop fires once and `2.json` (the rewrite) answers clean.
- `actor/` plays every session the same: one scroll, then an answer. `ease/` rates it.
