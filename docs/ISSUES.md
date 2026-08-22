# Issues — the communication grammar for the channel humans actually read

The issue channel is becoming the front door of this project (Eric, 2026-08-21: *"GitHub issues seem
like a system that is bound to become a constraint as more humans engage"*). Every idea, bug and plan
now lands there — and **each one is read by two audiences at once**: a human deciding whether to care,
and a zero-context AI session about to build it. This page is the grammar that serves both.

Sibling docs: [`PICTURES.md`](PICTURES.md) (the picture grammar, shared verbatim),
[`ENGINEERING.md`](ENGINEERING.md) → *Change communication* (the same rules for commits and PRs).
Machine-checked by `node scripts/issue-lint.mjs`. The drill that files one: `/issue`.

## The measurement that started this

`node scripts/issue-lint.mjs --audit` reports it live. Baseline, 71 issues, 2026-08-21:

| Surface | fold (`<details>`) | picture | table | headings |
|---|---|---|---|---|
| **Issues** | **1%** (1/71) | **0%** (0/71) | 5% | 19% |
| PRs, last 60 (templated + gated) | **100%** | 26% | — | — |

Of the 21 **human-facing** issues (the `[event-research]` lane is machine-to-machine and exempt),
**14 fail the contract below** — almost all for the same reason: no fold.
The eight longest issues (#466 at 6,722 chars, #467 at 6,787) are **100% above the fold**: no
summary, no picture, no fold — the exact wall Eric named. This is not an authoring-discipline
problem. The PR surface got a template, a guide and a gate; the issue surface got none of the three,
and the numbers track that difference and nothing else.

## Why this shape (the research, not our opinion)

- **People scan; they do not read.** NN/g eye-tracking: users read **20–28% of the words** on a page,
  in an F-pattern — first line most thoroughly, then left edges. A 6,000-char issue is not read
  slowly, it is *skipped*. → the one-line ask, the bold left edge, the fold.
- **The first line is the whole summary.** Google's CL-description rule: line one is a short,
  complete, **imperative** sentence; the body carries the why, the context and the shortcomings.
  Their named anti-patterns — *"Fix bug"*, *"Phase 1"* — are issue-title anti-patterns too.
- **The information a builder needs most is the information a reporter finds hardest to give.**
  Zimmermann et al. (*Information needs in bug reports*, CSCW 2010; 466 developers across Apache,
  Eclipse, Mozilla) found steps-to-reproduce, stack traces and test cases rank top in usefulness and
  top in difficulty. → we never solve that by asking harder. The `/feedback` coach interrogates for
  those items so the member does not have to know they matter.
- **Structured comment labels remove ambiguity** (Conventional Comments): a `nitpick:` and an
  `issue:` read identically as prose and completely differently as decisions.

**The synthesis that makes it free:** `<details>` collapses for humans while staying fully present in
the raw markdown an AI session reads. The fold costs the machine audience *nothing* and saves the
human audience *everything* — there is no trade-off to manage, only a habit to install.

## The capsule — the house shape

Copy-paste skeleton. Everything above the fold fits one phone screen; everything else lives below it.

```markdown
**One-line ask, imperative, ≤120 chars — what changes and for whom.**

| | |
|---|---|
| **Type** | enhancement · needs-eric |
| **Surface** | `/feedback` |
| **Size** | ~2 PRs |

- Talking point — the change, in outcome terms (≤120 chars).
- Talking point — why it matters / what is better after.
- Talking point — what Eric must decide, or "nothing needed".

<details><summary><strong>The brief</strong> — current state, criteria, constraints, forks</summary>

### Where it stands today
### Acceptance criteria (EARS)
### Constraints & non-goals
### Settled forks (decision log)
### Open questions
### Slicing sketch

</details>
```

Rules that make it work, in priority order:

1. **Lead with the ask, never with provenance.** "Eric's direction, refined in session…" is a
   below-the-fold sentence. The first line is what changes.
2. **Talking points, not paragraphs.** 2–4 bullets, ≤120 chars each. If a bullet needs a comma-spliced
   second clause, it belongs below the fold.
3. **Tabulate any repeated key→value data.** Type/surface/size, symbol→verdict, option→trade-off,
   step→owner. A table is scanned; the same content as prose is skipped.
4. **One fold, not five.** Nested or scattered `<details>` reads as a filing cabinet. One brief.
5. **The picture is ideal wherever one exists** — see below.
6. **Never hide a blocker below the fold.** `needs-eric`, an irreversible touch, or "this is blocked"
   goes above it, always.

## Pictures in issues (Eric, 2026-08-21: *"pictures are also ideal"*)

Same decision table, same honesty rules, same waiver right as [`PICTURES.md`](PICTURES.md) — read it
once; this section is only what differs for issues.

| Issue type | The picture that earns its place |
|---|---|
| Bug on a visual surface | the member's screenshot / clip — already the highest-value field on the form |
| Plan or multi-slice story | `flowchart LR` of the end-state path (join → approve → connect → trade) |
| New route or request path | `sequenceDiagram` |
| Gate, mode, or lifecycle change | `stateDiagram-v2` |
| Options / trade-offs to settle | a table: option · what you get · what it costs |
| Idea, one-liner, small ask | **waived** — `Picture: waived — one-line ask` |

Two issue-specific cautions:

- **A proposed picture is a claim about the future**, so caption it as one: `_Caption — proposed
  end-state flow, not yet built._` PICTURES.md's grounding rule (every node names something real)
  applies to the *shipped* frame; an issue's diagram is allowed to draw the target, never allowed to
  imply it exists.
- **Screenshots on issues are hosted by GitHub** (drag-drop → `user-images.githubusercontent.com`),
  not committed to `docs/shots/`. The ≤100KB rule is a git-history rule and does not apply; the
  SHA-pinning rule does apply to any raw repo URL you paste.

## What is gated, what is taste

Existence and honesty are machine-checked; taste never is (repo doctrine — a comment-only format rule
decayed to 4/126 PR bodies, every gated one held).

| Check | Rule | Why |
|---|---|---|
| fold | body >1,200 chars must carry a `<details>` | the wall, measured |
| above-fold budget | ≤1,200 chars before the first fold | ~one phone screen |
| bullets | ≤120 chars each | matches `ship.sh checkbody` |
| duplicate blocks | no paragraph repeated verbatim | #455 shipped its whole body twice |
| mermaid | stable types only | a syntax error renders as the opening frame |
| raw URLs | SHA-pinned | branch URLs 404 at squash-merge |
| title | imperative, ≤80 chars, not `Fix bug`-class | Google's rule, their anti-patterns |

**Who this binds: Claude.** Every issue Claude files — plans, handoffs, fan-outs, capsules — passes
`issue-lint` before it is filed. **Who it never binds: members.** A human's raw note is never
rejected for shape; the coach and the templates do that work on their behalf. Taxing the reporter is
the one move Zimmermann's finding rules out.

## Comments — the surface that outnumbers issues 10:1

An issue's body is written once; its comments accumulate forever, and they are what a human actually
returns to.

- **Progress comments** (build sessions): one status line, then the delta. `**Slice 1/5 — shipped.**
  Owner link + flag removal merged in #472. Next: `/join` queue.` Logs, command output and diffs go
  in a fold or are omitted — the PR is the record.
- **Review-style comments** carry a Conventional-Comments label so intent is unambiguous:
  `praise:` · `nitpick:` · `suggestion:` · `issue:` · `question:` · `thought:` · `chore:`, with
  `(blocking)` / `(non-blocking)` / `(if-minor)` when it changes what the reader must do.
- **Answering Eric's question is a comment, not a rewrite.** Editing the body under him destroys the
  thread's history; the body is the capsule, the comments are the conversation.
- **One decision per comment.** A comment asking three things gets one answer.
