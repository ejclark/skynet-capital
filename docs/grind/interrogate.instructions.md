---
name: interrogate
description: interrogate one process/policy/design directive — steelman, red, blue, tiger, yellow — and leave a call sheet plus a routing label
model: fable
effort: high
isolation: none
outcomeCheck: 'test "$(curl -sSf -H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" "https://api.github.com/repos/ejclark/skynet-capital/issues/{item}/comments?per_page=100" | grep -c -- "!-- interrogation --")" -gt 0'
---

# Interrogate one directive — is the mechanism right, and what is its best shape?

**Calling convention:** the front matter above is the calling convention — generate the call with
`node scripts/grind-manifest.mjs --args --items '<json>' --item-source '<where the list came from>' docs/grind/interrogate.instructions.md`.
`model: fable` + `effort: high` because this is adversarial judgment against a person's stated
intent, the one place an under-resourced pass does real damage (it either rubber-stamps or
manufactures objections). `isolation: none` — nothing is edited or pushed; the deliverable is one
comment and a label.

Items are issue numbers (`"1350"`). A directive that arrived in chat is filed as a capsule first
(`/issue`) so the interrogation has a durable home — plans and decisions live in issues, never in
a session's context.

## Why this chore exists

Eric, 2026-09-04: *"I feel like you inadequately interrogate my suggestions/commands. It feels
like we need event triggers and/or listeners to trigger interrogation process which organically
feeds into grinding fan-out process."* The measurement behind it: of four process directives that
day, the two that got a red/tiger pass (#1343 platter, #1318 WIP=1) got it only because a chore
forced one; the two that did not (the compute dial, the workflow view) were built straight from
the prompt. Compliance was the default; interrogation was accidental. This chore is the fan-out
half of the fix; the Orient output style's *Interrogate* step is the in-session listener that
routes here when an objection survives its one-line pass.

**What gets interrogated is the mechanism, never the outcome.** Eric directs by outcome; the
outcome is his. "Push back hard when there's an ideal path" (Eric, 2026-09-04) is about the *path*.
A call sheet that argues with the goal has misread the job.

## Steps

1. Read the issue and every comment on it (`curl -sS -H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" https://api.github.com/repos/ejclark/skynet-capital/issues/<n>` and `/comments?per_page=100`). Then read
   `docs/research-teams/PLAYBOOK.md` ("Don't make assumptions", "The team-role library"),
   CLAUDE.md's "Guiding frameworks", "Idea routing", and "…but the bar is not silence" paragraphs,
   and `.claude/output-styles/orient.md` → "Reading intent". These set the bar and the tone.
2. **Steelman first.** Restate the directive in its strongest form, in two parts: the *outcome*
   it is after (what would be true afterwards) and the *mechanism* it proposes. Quote Eric's
   words verbatim where the issue carries them; the wording often carries more charge than the
   point needs (Orient → "Reading intent"), so name what the literal wording implies and then
   engage the point. If outcome and mechanism cannot be separated, the directive is a taste call
   — skip to step 7 and route `needs-eric` with the options rendered so he can judge by eye.
3. **Blue — what already serves the outcome.** Enumerate what in this repo already does the job
   or part of it: skills, agents, gates, hooks, output styles, chores, lanes, doc lines. Read the
   literal source (`file:line`), not the README's description of it. The most common finding is
   that the *listener* already exists and only a *step* is missing — say so precisely, because it
   changes the build from "new event system" to "one paragraph".
4. **Red — the strongest objection.** One of: the premise is false (show the evidence); the
   mechanism is worse than an alternative for the same outcome (name it); it would fire on
   everything (death by 10,000 cuts — CLAUDE.md → "Interrupt economics"); it collides with a
   framework or a written rule (cite the line). An objection must cite a line, a number, or a
   reproducible observation — a reviewer told to find gaps manufactures them, and an objection
   with no citation is a manufactured one. If no objection survives, the sheet says so in one row
   and the chore is done in minutes; that is a legitimate, common result.
5. **Tiger — blast radius if adopted verbatim** at fan-out scale: what breaks, is it reversible,
   does it touch `envelope.json`'s protected class (`node scripts/envelope-scan.mjs --check
   <paths>`), does it change how every lane or every prompt behaves.
6. **Yellow — the learning loop.** What would be measured, over what window, to know the
   mechanism worked; and the dated observation that would prove the whole call wrong.
7. **Post exactly one comment**, whose first line is `<!-- interrogation -->`, in call-sheet form:
   - One line restating the **outcome** (his), untouched.
   - A table, one row per shape of the mechanism — **verbatim** · **amended** (name each
     amendment) · **reject** · **status quo** — with **the call** (adopt · amend · reject · stand
     aside) · **confidence** · **the one-line why** · **the dated observation that proves it wrong**.
   - **Recommended next step**, one imperative line — the do, then the why after an em dash.
   - **Sources**: `file:line` in this repo, Eric's quoted words, `[official]` docs for any external
     claim. A claim with no checkable source doesn't get a row.
   - Fold the full steelman, the blue inventory, and the attack list in one `<details>` block.
   Post with `curl -sS -X POST -H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" https://api.github.com/repos/ejclark/skynet-capital/issues/<n>/comments -d @comment.json` (`{"body": "..."}`), ending with the standard attribution footer (a blank line, `---`, `_Generated by [Claude Code](https://claude.ai/code)_`).
8. **Apply the label the call implies** (`POST .../issues/<n>/labels`): `feedback` when the
   adopted or amended shape is buildable now, in-envelope; `needs-eric` only when a genuine fork
   remains that evidence cannot settle — and then the comment renders the options as things he can
   judge by eye, never as a technique to arbitrate; `next-slice` when it depends on something
   landing first. If the issue already carries `needs-eric` and the sheet shows no decision remains,
   remove it (`DELETE .../issues/<n>/labels/needs-eric`) and say which evidence settled it (Eric,
   2026-09-04, on #1318: "that is fantastic; ideal"). Never close the issue.
9. Report `status: "done"` with the comment's `html_url` in `summary`.

## Guardrails

- **Mechanism, not outcome.** The goal is never on trial; the path is. A sheet whose "reject" row
  argues with what Eric wants has done the wrong job.
- **Objections cite or die.** Every red row carries a `file:line`, a number, or a repro. No
  "it might be confusing" rows.
- **Proportional.** Clear + reversible + one file is not a directive; report "no objection
  survives — nothing to interrogate" and stop. The chore exists for changes that compound (process,
  policy, design, architecture, anything every future session inherits).
- **"Don't" is first-class**, and so is "do it exactly as said". Confidence drives the call; a
  low-confidence amendment is a stand-aside, not a hedge.
- **Research and one comment only.** No code, no branch, no PR. The `feedback` label hands the
  build to the lane; the Orient step hands an in-session build back to the session that asked.
- **Don't widen.** A second directive noticed on the way is its own issue, linked from the comment.
