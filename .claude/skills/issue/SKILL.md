---
name: issue
description: >-
  File (or rewrite) a GitHub issue as a capsule two audiences can both use — a human who decides in
  ten seconds whether to care, and a zero-context build session that has nothing but this text.
  Use whenever an idea, bug, plan or handoff is being filed as an issue, whenever the fan-out route
  fires ("file this as its own issue"), and before pasting any long body into GitHub. Also when an
  existing issue reads as a wall and needs reshaping. The grammar is docs/ISSUES.md; the gate is
  scripts/issue-lint.mjs.
---

# /issue — the capsule drill

The grammar, the research behind it and the copy-paste skeleton live in
[`docs/ISSUES.md`](../../../docs/ISSUES.md). This skill is the **drill**: the order of operations
that gets a well-shaped issue filed without a second pass.

## Why the shape (one line each)

- People read **20–28%** of a page and scan in an F-pattern (NN/g) → one-line ask, bold left edge.
- `<details>` is invisible to humans and **fully present** for the AI session reading raw markdown →
  the fold costs the machine audience nothing.
- The 2026-08-21 corpus: **1/71** issues folded, **0/71** carried a picture, while the templated and
  gated PR surface ran at 100% — enforcement, not willingness.

## The drill

1. **Pick the audience split before writing.** What must a human know in ten seconds (the ask, the
   stakes, what's needed from them) vs. what only the builder needs (criteria, constraints, forks)?
   The first list is the top; everything else goes below the fold.
2. **Write the one-line ask first** — imperative, ≤120 chars, outcome not provenance. If it will not
   fit, the issue is two issues.
3. **Tabulate the metadata** (type · surface · size · blocked-on). Never prose.
4. **Draft 2–4 talking points**, ≤120 chars each.
5. **Add the picture, or waive it out loud** (drawing one → `/mermaid`; who reads it → `docs/READERS.md`). Plan → `flowchart LR` of the end-state; route →
   `sequenceDiagram`; gate/mode → `stateDiagram-v2`; options to settle → a table; one-liner →
   `Picture: waived — <reason>`. Caption a proposed diagram as proposed
   ([`docs/PICTURES.md`](../../../docs/PICTURES.md) grammar, unchanged).
6. **Everything else into one `<details>` brief** — where it stands, EARS criteria, constraints,
   settled forks, open questions, slicing sketch. One fold, not five.
7. **File it with one command** — lint, dedupe, footer and the REST call in one step:
   ```sh
   npm run issues -- create --title "<title>" --body-file /tmp/issue-body.md --labels needs-eric
   ```
   It refuses on a lint problem (fold, bullet length, duplicate paste, mermaid, unpinned raw URL,
   empty-calorie title) and on an open issue with the same ask (`--force` overrides, `--dry-run`
   checks without filing). Notes are advisory. Prints `#N [Board status] title`.
8. **Everything after filing uses the same command**, never the GraphQL MCP for bulk work:
   `update N --add a --remove b --body-file f --comment-file c --close completed`,
   `search "words" --label x`, `show N`. The board column follows labels (the sync job maps
   `needs-eric`/`needs-info` → Blocked, `ready` → Ready, closed → Done), so "mark it blocked" is
   `update N --add needs-eric`. Full usage: the header of `scripts/issues.mjs`.
9. **Label deliberately.** `feedback` starts a Moneypenny build session on triage; `needs-eric`
   parks it for his flip. Filing alone never authorizes work — that invariant is load-bearing on a
   public repo and this skill never widens it.
10. **A plan gets its state block as the first comment**, posted right after filing and edited in
    place from then on: the slices as a `stateDiagram-v2` with the current one marked, what
    changed and the next pickup in ≤3 plain lines on top, the rules line, a dated log, then `### For
    the builder` (one PR or several · repo-qualified inputs · a done line in EARS · the falsifier). Shape and the four rules: `docs/ISSUES.md` → *The
    state block*. The body's Slicing sketch ends with `State block: the first comment, edited in
    place` so the lint knows one exists.

## A tangent that needs its own planning session, not a two-line issue

Hand it off to a fresh session with `create_session` (or `spawn_task` from a plan-mode parent,
which cannot start a more-permissive child) — the template, the three end states it must land in,
and the as-of-sha rule: [`docs/ISSUES.md`](../../../docs/ISSUES.md) → *Delegating a tangent to a
planning session*.

## Reshaping an existing wall

Same drill, one extra rule: **edit the body, answer in comments.** Rewriting the capsule is fine;
rewriting text Eric wrote destroys the thread's history. Move his words into the fold under
*Settled forks* verbatim and quote-attribute them.

## What this drill will not do

- **Gate a member's words.** A human's raw note is never rejected for shape — the `/feedback` coach
  and the issue forms carry that load on their behalf (Zimmermann et al.: the information a builder
  needs most is the information a reporter finds hardest to give). `issue-lint` binds Claude only.
- **Hide a blocker.** `needs-eric`, an irreversible touch, a hard dependency: above the fold or it
  did not get communicated.
- **Invent detail.** A capsule organizes what is known and names what is not, under *Open questions*.
