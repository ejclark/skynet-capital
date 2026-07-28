# DECOMPOSE — the split playbook

One god file becomes many small ones **one safe, reversible PR at a time**. This is the *recurse* step
of the decomposition loop; the fitness gate (`scripts/arch-scan.mjs` + `arch-budget.json`, enforced by
`tests/arch/budget.spec.ts`) is the *base case* that says when to stop. Follow this exactly — the value
of an autonomous decomposer is that every split is done the same disciplined way.

## Pick the target (don't guess)

```bash
node scripts/arch-scan.mjs --candidate
```

Emits the highest-leverage split target as JSON — scored by how far over/near budget it is **times a
cohesion penalty for many exports**, so a smaller file doing many jobs outranks a bigger cohesive one.
Take `candidate`. One target per PR.

## The split, step by step

1. **Read for seams, not lines.** Find a cohesive cluster inside the file — a group of functions/consts
   that share a responsibility and could be imported as a unit (e.g. all the `escapeHtml`/`chip`/`tile`
   render helpers; one route handler; one shader; the payoff-math). Split along a seam, never mid-idea.
2. **Extract to a new module** under the natural home (`src/ui/`, `src/scene/lego/`, `src/observatory/`…).
   Export the cluster; import it back into the original file. **Behavior must not change** — this is a
   move + re-import, not a rewrite. Keep names identical so call sites are untouched where possible.
3. **Check the blast radius** with Graphify before trusting it:
   ```bash
   graphify affected <the-file-you-changed>
   ```
   Confirm only the expected dependents are touched. (See `docs/GRAPHIFY.md`.)
4. **Verify green, by exit status** (not tailed output — a pipe to `tail` masks failures):
   ```bash
   npm run typecheck && npm run lint && npm test && node scripts/arch-scan.mjs
   ```
5. **Ratchet the budget DOWN** so the win is locked in and the limit permanently tightens:
   ```bash
   node scripts/arch-scan.mjs --update    # budgets only ever lower
   ```
   Commit the updated `arch-budget.json` in the same PR.
6. **If the new module is itself still a god file, stop and recurse:** it's a fresh target for the next
   PR, not a bigger split now. Small green PRs over one heroic cut.

## Rules

- **One split per PR.** Bounded blast radius, easy review, trivial revert.
- **Never change behavior in a decompose PR.** No bug fixes, no new features riding along — a pure move
  keeps the diff reviewable and the revert safe. Behavior changes are a different PR.
- **The inline-login-canvas caveat holds:** its JS is a TS template literal — no backticks/`${}` inside
  it (`docs/ENGINEERING.md`). Extracting from `authenticator.ts` means extracting to real `.ts` modules
  with a build step that re-inlines, not pasting strings around.
- **Conventional Commit, lowercase-led subject** (`refactor: extract … from …`). Squash-merge on green.
