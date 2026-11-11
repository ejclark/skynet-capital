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

## How rows get recorded (#6953 slice 3)

The assignment card (`scripts/moneypenny/ask-card.mjs`) carries each question's options and Claude's
prediction. When Eric's first reply under an ask is a letter on the card, `yes`, `no` or `not now`,
the lane (`answer-readback.mjs`) answers "Read as: …", takes `needs-eric` off, unassigns him and
leaves a scored row in that comment: `match` or `miss` against the predicted letter, `unclear` for a
deferral, "score by hand" when the prediction was prose. Plan and feedback issues are skipped, since
their own reply path resumes the build with the reply as the answer. Nothing acts on the answer:
a reply of "merge it" is never read as the merge.

`node scripts/moneypenny/answer-readback.mjs --ledger [--apply]` collects the last week's rows into
the table below, once each, with the row's key in a hidden comment. No scheduled lane runs it or
opens rule 3's graduation PR: a session does both.

## Ledger

| Date | Class | The ask | Predicted (confidence) | Eric's answer | Score |
|---|---|---|---|---|---|
| 2026-10-18 | session housekeeping | Archive this session? | — (no prediction recorded) | No, keep open | not predicted |
| 2026-10-18 | bot safety rules | Stop the CRWV wheel at its check on a 1-in-3 assignment rule, or only if losing money? (first wording) | Only if losing money (high) | "the 1-3 you reference is unclear" | unclear |
| 2026-10-18 | bot safety rules | Same, asked in plain words | Only if losing money (high) | Only if losing money | match |
| 2026-10-18 | bot safety rules | #5730 · let a breaker tripped by an outage re-arm at the next session? | Yes, outage breakers only (medium) | — | pending |
| 2026-10-18 | engineering gates | #5730 · raise 11 over-budget debt gates to today's counts? | Yes (high) | — | pending |
| 2026-10-18 | session housekeeping | Archive this session? (asked with the archive audit's all-green table) | Yes, archive (high) | Yes, archive | match |
| 2026-10-26 | member onboarding | Is Narayan joining as a member, a code contributor, or both? | both, member first (medium) | member first, through the Moneypenny chat; GitHub guided; a subscription maybe later | match |
| 2026-10-26 | spend limits | #6020 · the research spend breaker never counted; trip at $60/4h scaled by the dial, keep $15, or leave it? | $60/4h scaled by the dial (medium) | A2 on 2026-11-01, not this line | miss; a measurement replaced this prediction before he answered, see the 2026-11-01 row |
| 2026-11-01 | spend limits | #6020 · trip the research spend breaker at A2, $100 per 4h and $200 at surge? | A2 (medium-high) | A2 | match |
| 2026-11-01 | member trade surfaces | #5709 · where does a long call's exit plan show: in the ticket (A), at review (B), after the fill (C), or not at all (D)? | A, in the ticket (medium) | B: a strategy carries its exit plan before the trade, and it shows at review | miss |
| 2026-11-01 | credentials | #4621 · press the button that sets the bridge password, and approve the run it starts? (first wording) | Yes (high) | "what is there to approve?" | unclear |
| 2026-11-01 | credentials | #4621 · Same, asked again in chat | Yes (high) | Yes, in chat | match |
| 2026-11-05 | session housekeeping | #6870 S1 done and its replay failed the bar: archive the session, or run iteration 2 (the Nit line, ~5.3M tokens) here first? | Archive; iteration 2 in its own session (medium) | Run iteration 2 here first | miss |
| 2026-11-07 | screen design (taste) | #7018 round 0 · which problem to fix first on today's landing? | No market on screen (medium) | Asking is out of sight | miss |
| 2026-11-08 | screen design (taste) | #7018 fork (a) · a newspaper or a mission briefing? | One page: newspaper format, mission narrator (medium) | Build "News, mission narrator" | match |
| 2026-11-08 | screen design (taste) | #7018 fork (b) · where do quests sit? | Under each story, plus a part from the member's own book (medium) | Build "Each by its source" | match |
| 2026-11-08 | screen design (taste) | #7018 round 1 Q1 · where do you ask? | Under each story (medium) | More of both under-each-story and one ask up top; "canned selections as fallbacks" | miss |
| 2026-11-08 | screen design (taste) | #7018 round 1 Q2 · what joins the news at the top? | One line on you, under the news (medium) | Not "what's new"; no signal on the line or the card | pending |
| 2026-11-08 | screen design (taste) | #7018 forks (c) whose question led to an article, (d) the name "Skynet Chronicles" | (c) yes, members only (medium-low); (d) the landing page takes the name (medium) | Drawn on every round-1 frame; no mark on either | pending |
| 2026-11-08 | screen design (taste) | #6948 · the landing page's first round: close, he adds or cuts a section? | Close; he adds or cuts a section (medium) | Cut "what's new"; asked each story to fold to its key facts | match |
| 2026-11-08 | screen design (taste) | #7018 round 2 Q2 · where do the coming reports sit? | On the story they bear on (medium) | Build "Dates on the story"; lead with the events and add up / down / volatile icons | match |
| 2026-11-08 | screen design (taste) | #7018 round 2 Q1 · confirm your own question first | As drawn (high) | Unanswered; decided on his behalf at his ask ("make judgement calls on my behalf to get this movement rolling") | decided on his behalf |
| 2026-11-08 | screen design (taste) | #7018 round 3 Q1 · how do the 11 sectors read: lines, tiles or bars? | C, bars (no confidence stated; the simulated Eric's pick, #7118) | More of all three; on his second read, bars "fully redundant with the percentage change" | miss |
| 2026-11-08 | screen design (taste) | #7018 round 3 Q2 · how do the stories sit on the calendar? | A, today then the days (no confidence stated; the simulated Eric's pick, #7118) | More of A, Not the week strip; his second read added B's grouping by day | match |
| 2026-11-09 | screen design (taste) | #7018 round 3 · does round 1's "actionable items at the top" put the question box back above the overview (AT9)? | — (no prediction recorded; AT9 shipped as the default) | No: that note "was geared towards singular-ish path oriented workflows" | not predicted |
| 2026-11-09 | screen design (taste) | #7018 live review · his notes list the mission box first: does it lead again, or does AT9 stand? | AT9 stands; the list was the design method, not the page order (medium) | Overview first | match |
| 2026-11-09 | screen design (taste) | #7018 round 4 Q2 · after her answer, outline one row or pivot the page? | B, the pivot (medium) | More of B, with notes on the Eye's light and threads | match |
| 2026-11-09 | screen design (taste) | #7018 round 5 Q1 · the refined page as drawn, the overview first | Build as drawn (medium) | The question box and canned paths first, "after seeing the visual"; a desktop calendar grid. Reverses his chat answer above | miss |
| 2026-11-09 | screen design (taste) | #7018 round 5 Q2 · an outline, or the Eye's light? | B, the Eye's light (medium) | Build B | match |
| 2026-11-09 | screen design (taste) | #7018 round 5 Q3 · where does a side thread live? | A, under each answer (low) | More of C, on its row; collapsible, with dividers | miss |
| 2026-11-09 | screen design (taste) | #7018 round 6 Q3 · how does the light travel: a sweep, a spark, or a spotlight? | B, the spark (medium) | Build B; More of C, the spotlight, banked | match |
| 2026-11-09 | screen design (taste) | #7018 round 8 Q1 · the page with your goal first, as drawn | Build as drawn (medium) | Build A | match |
| 2026-11-09 | screen design (taste) | #7018 round 8 Q2 · where does the Eye watch from while the chat is open? | A, between the chat and the page (medium) | Build A | match |
| 2026-11-09 | screen design (taste) | #7018 round 8 Q3 · the spark with the spotlight folded in, as drawn | Build as drawn (medium) | Build A | match |
| 2026-11-09 | screen design (taste) | #7018 round 8 Q4 · a priced band, or the 20 closes inside the band? | B, the 20 closes (medium) | More of B | match |
| 2026-11-09 | screen design (taste) | #7018 round 9 · where does the tower live: right then between, or a left rail? | B, a left rail (low) | Build B | match |
| 2026-11-10 | review queue | Merge the 4 green held PRs (#7211, #7030, #7271, #7080) that 5 queued plans wait on? | Yes, merge them (high) | "Merged them": the PRs were still open, so the session merged them on that yes | match |
| 2026-11-10 | member data sharing | #6007 · do screenshots in Moneypenny's chat stay private to the member and her? | Private (medium) | "user account and trade information is visible to other users for the sake of gameplay. in that light, screenshots of money penny are not private" | miss; inside the invite gate the default is shared, so a privacy question there needs the gate named first |
| 2026-11-11 | schedule (arming) | #7311 · run the audit-and-flip Routine daily after the morning steer, or weekdays only? | Daily, after the steer (medium) | "Yes, daily" | match |

The 2026-11-01 predictions are copied from each issue, where they were written before he answered; the rows themselves were added after, on the day the ledger was caught up.
