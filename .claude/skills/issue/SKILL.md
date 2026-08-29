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
5. **Add the picture, or waive it out loud.** Plan → `flowchart LR` of the end-state; route →
   `sequenceDiagram`; gate/mode → `stateDiagram-v2`; options to settle → a table; one-liner →
   `Picture: waived — <reason>`. Caption a proposed diagram as proposed
   ([`docs/PICTURES.md`](../../../docs/PICTURES.md) grammar, unchanged).
6. **Everything else into one `<details>` brief** — where it stands, EARS criteria, constraints,
   settled forks, open questions, slicing sketch. One fold, not five.
7. **Lint before filing**, always:
   ```sh
   node scripts/issue-lint.mjs --title "<title>" /tmp/issue-body.md
   ```
   Problems are fatal (fold, bullet length, duplicate paste, mermaid type, unpinned raw URL, an
   empty-calorie title). Notes are advisory — read them, then use your judgment.
8. **File it** with the REST path (cheap bucket), never the GraphQL MCP for bulk work:
   ```sh
   curl -sS -X POST -H "Authorization: Bearer $GITHUB_TOKEN" \
     -H "Accept: application/vnd.github+json" \
     https://api.github.com/repos/ejclark/skynet-capital/issues \
     -d @issue.json   # {"title":…,"body":…,"labels":[…]}
   ```
9. **Label deliberately.** `feedback` starts a Moneypenny build session on triage; `needs-eric`
   parks it for his flip. Filing alone never authorizes work — that invariant is load-bearing on a
   public repo and this skill never widens it.

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
