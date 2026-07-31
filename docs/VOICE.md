# Voice — how Eric communicates, and how to parse him

A decoder, not a critique. Eric dumps raw and fast by design (`CLAUDE.md` → _Idea routing_): the
adapter is Claude, not Eric. This file is that adapter made explicit, so a cold session parses him
correctly on the first read instead of re-learning it every time.

His own description: _"My sentence structure is unique and often times feels backwards/transposing
segments of thought where emphasis is inverted."_ That is accurate, and it is **systematic** — which
means it's decodable. The rules below are derived from observed messages, not invented. They are
provisional and Eric's to correct; corrections are updates.

---

## The one rule that matters most: emphasis is terminal

**The load-bearing claim arrives last.** Openings set context, hedge, or restate the frame; the payload
lands at the end of the sentence, the end of the message, or immediately after a pause marker. This is
the "inverted emphasis" he names, and it inverts the usual convention where the topic sentence leads.

> "This is a pattern of traditional development lifecycle systems that overlays with the unknown
> lifecycles in the AI ecosystem**.. all the same mechanics are important, jsut take place in different
> spots**"

The thesis is the trailing lowercase aside. Everything before it was setup.

> "Perhaps my role has been automation engineer across all archtypes with my core strengths being in
> tech debt clean up, renovate automation; **adding test systems to enable gold tier level renovate
> recipes capable of automerge everything but breaking changes**."

The sentence gets *more* specific as it runs, and the final clause is the whole argument.

**Practical rule: read the last sentence first, then re-read from the top.** If a message seems to
wander, the destination is the end — the wander was the approach path.

## Operators — punctuation carries meaning, not ceremony

| Marker | What it means | Example |
|---|---|---|
| `..` | **Pivot to the punchline.** Not a typo or trailing-off — what follows is the insight. | "…in the AI ecosystem.. all the same mechanics are important" |
| `->` | **Causal chain.** Each arrow is "which causes"; the terminal node is the goal being optimized. | "safes time thinking -> better dx"; "fewer tokens spent -> increases throughput" |
| `-` (after a word) | **Label / route / define.** A namespace prefix or a definition operator. | "tangent - sub-agents feels like…"; "instructions - reinforce strong opinions" |
| `;` | **Zoom-in**, not clause separation. Means "and specifically". | "renovate automation; adding test systems to enable gold tier…" |
| `/` between words | **A semantic field, not indecision.** The *set* is the meaning; no single member is the right one to pick. | "intent/goals/interests", "interconnect/associate", "opinions/skills/instructions" |

Do not collapse a slash-group to one word when responding — it flattens the idea. Mirror the set or
name the field.

## Hedged openers, confident payloads

"Perhaps…", "I think i may have…", "feels like…", "This could also be…" precede his **sharpest and
highest-priority** claims. The hedge is politeness and speed, not uncertainty or low stakes.

> "**I think i may have** discovered my archtype - automation engineer … this idea feels high priority
> with a timeline to influence an onboarding decision to a new position at work."

Maximum hedge, maximum stakes. **Never downgrade priority because of a hedge.** Conversely, explicit
priority statements are rare — when he does state one plainly, weight it heavily.

## Structure signals

- **Nested outlines are a depth-first dump of a whole domain.** Indentation is taxonomy, not rank. Leaf
  nodes are frequently *more* load-bearing than their parents ("decomposing skills → reduce complexity"
  — the leaf is the actual design constraint).
- **Fragments carry complete ideas.** "maintaining balance" is a full design principle, not a stub
  awaiting elaboration. Expand it; don't ask him to.
- **He often routes his own message** ("tangent -", "think tank -"). Honor the label — a tangent is
  banked, not built.
- **Typos and doubled letters are capture speed, never signal.** "oininions", "jsut", "safes",
  "arfitcats". They correlate with *high* idea density — he's typing ahead of the keyboard. Never treat
  a typo-dense message as low-effort, and never mirror the correction back at him.

## Register and cadence

Lowercase-led, minimal punctuation ceremony, no preamble, no sign-off. Speed of capture is prioritized
over polish, deliberately — that's the whole point of the routing convention. **Terse ≠ small.** A
two-line message can carry a system-level idea ("This is also anoather way to index" reframed the
entire think-tank ask).

He also builds ideas **across turns rather than within them** — a claim gets stated, then sharpened once
or twice in follow-ups as he reacts to the response. Expect refinement; treat the first statement as a
draft he intends to revise, and the third as the real one.

## How to respond, given all of this

- **Put the answer first.** His structure is emphasis-last; the useful complement is emphasis-first,
  because he's reading for the verdict.
- **Reflect the decoded version back** when a message was tangled — briefly, as a shared reading, not
  as a correction of his phrasing.
- **Answer the trailing aside.** It's the real question, and it's the part most likely to be skipped.
- **Give a position, not a survey.** He argues back productively (see: the archetype thesis sharpening
  across three turns), so a stated view is more useful to him than balanced options.
- **Don't mistake a dump for a directive to build.** Route per `CLAUDE.md`: act now · park · profile
  note · question.

## Response length is not the cost — obligation is

Counterintuitive and corrected by Eric directly: _"faster responses would also reduce my ability to
think/type out new ideas."_ **Generation time is buffer** — he drafts the next idea while Claude writes.
So a long or slow reply is not a flow-breaker; **a reply that demands a decision is.** Questions, option
menus, and "which should I build?" force him to stop, read, and answer before he can continue.

Optimize for **"nothing here needs you"** rather than for brevity. When he's mid-flurry, bank and build;
queue the forks for when he surfaces.

**Firehose mode** is the declared version of this: Claude keeps working and banking, but issues no
questions, no option menus, no decision requests. Eric has **granted standing authorization to be
reminded to enter it** — "I'll try to remember that, but may forget. if reminding me is
beneficial/needed, do it." So offer it when the signal appears (several dumps in a row, ideas arriving
faster than they're being resolved, explicit "I'm having more ideas than I can keep up with"). Offer it
as a one-liner, never as a question that itself demands an answer.
