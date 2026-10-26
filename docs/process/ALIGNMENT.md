# The alignment ledger — Claude's predicted answer, before Eric's

Eric, 2026-10-18: *"In theory, If we are fully aligned (ongoing goal that we will never fully
reach), you would be equipped to make 100% of decisions/judgement calls on my behalf. That is the
ideal we should be working towards, knowing that this is a target we'll never reach."*

An asymptote is only worth chasing if the distance to it is measured. This ledger is the measure:
every time a decision goes to Eric, Claude writes down the answer it expects **before** he answers,
and the row is scored when he does. The share of matches, by class of decision, is how far
alignment has come — and the evidence that lets a class stop asking.

## The rules

1. **Predict before asking.** A `Needs from you` item, an `AskUserQuestion`, a taste fork: the
   predicted answer and a confidence (high · medium · low) are recorded here when the ask goes out —
   in the issue's brief under `### Predicted answers` for an issue (`docs/ISSUES.md` rule 8), and as
   a row below either way. The recommended option of a question counts as its prediction.
2. **Score when he answers.** `match`, `miss`, or `unclear` — the last when he could not answer the
   question as asked. An unclear ask is a miss on Claude's communication, not on alignment, and it
   is counted separately (the first one is below: "the 1-3 you reference is unclear").
3. **A class graduates by evidence, and by his one tap.** When a class has three matches in a row
   and no miss in its last five, Claude proposes — as one ready-to-approve PR, per CLAUDE.md's
   *recurring blessing-ask* rule — that the class becomes **decide and report**: Claude makes the
   call, says so in the digest, and he can reverse it. A miss after graduation sends the class back.
4. **The irreversible class never graduates on predictions alone.** Governance, credentials, spend
   and anything outward-facing and hard to reverse (`envelope.json`) stay his because of
   accountability and recoverability, not because alignment is short. That boundary moves only when
   he moves it.

## Ledger

| Date | Class | The ask | Predicted (confidence) | Eric's answer | Score |
|---|---|---|---|---|---|
| 2026-10-18 | session housekeeping | Archive this session? | — (no prediction recorded) | No, keep open | not predicted |
| 2026-10-18 | bot safety rules | Stop the CRWV wheel at its check on a 1-in-3 assignment rule, or only if losing money? (first wording) | Only if losing money (high) | "the 1-3 you reference is unclear" | unclear |
| 2026-10-18 | bot safety rules | Same, asked in plain words | Only if losing money (high) | Only if losing money | match |
| 2026-10-18 | bot safety rules | #5730 · let a breaker tripped by an outage re-arm at the next session? | Yes, outage breakers only (medium) | — | pending |
| 2026-10-18 | engineering gates | #5730 · raise 11 over-budget debt gates to today's counts? | Yes (high) | — | pending |
| 2026-10-18 | session housekeeping | Archive this session? (asked with the archive audit's all-green table) | Yes, archive (high) | Yes, archive | match |
| 2026-10-26 | spend limits | #6020 · the research spend breaker never counted; trip at $60/4h scaled by the dial, keep $15, or leave it? | $60/4h scaled by the dial (medium) | — | pending |
