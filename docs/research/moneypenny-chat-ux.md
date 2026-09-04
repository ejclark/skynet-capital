# Research: Moneypenny's chat rail — what the field knows, and what six teams found

**Question (Eric, 2026-09-03):** have we done any UX research on AI chatbot usage? There are basics
— starting new conversations, when to show canned responses, retaining history vs. new sessions —
that could be improved. Battle-test it.

**Date:** 2026-09-03 · **Surface:** the ✦ rail (`app/src/shell/moneypenny-rail.tsx`, store
`app/src/live/moneypenny.ts`, filing `app/src/live/moneypenny-filing.ts`, script
`app/src/live/moneypenny-script.ts`; server `src/companion/*`, `src/server/companion-routes.ts`) at
`main` after #1170. **Method:** primary-source research first (Microsoft's 18 HAX guidelines, NN/g's
chatbot studies, assistant-ui's thread model), then four teams against the code — red (adversarial),
blue (correctness), tiger (member journeys), white (this doc's heuristic audit) — folded purple into
one ranked fix list. No prior UX research on the chat existed in this repo; `trading-desk-ux.md` is
the nearest precedent.

**Status (2026-09-03):** P0–P2 shipped in #1174; P3 (red A3–A6) in the follow-up PR the same day. The falsifiers below are what to check live.

## The call

| # | The call | Confidence | The one-line why | Proves it wrong (dated) |
|---|---|---|---|---|
| 1 | **Fix the two consent breaks before anything else** — scope the persisted thread and draft to the member, render the draft she wrote, and file only on an explicit "send". | High | Red, blue and tiger each found them independently: a shared browser shows member B member A's thread and files A's parked draft under B's name; any reply — including "no" — files a draft the member never saw. | A 2026-09-05 walkthrough on one browser with two sign-ins still shows the first member's thread, or a "never mind" reply still files. |
| 2 | **The rail always opens on a greeting that states scope** — the ✦ path plays the intro too; a returning thread gets a one-line "hi again" and a date break. | High | HAX G1 "make clear what the system can do" and NN/g's site-chatbot finding that users can't tell what a bot is for; today ✦ opens on an empty pane. | After shipping, a fresh browser opening ✦ shows chips and a composer with no line from her. |
| 3 | **A canned beat may never swallow a real question** — the setup yes/no catches only a clear yes or no; everything else goes to her live. | High | Eric's own transcript: a question typed right after the intro got a scripted "no problem, the cards are on the onboarding page". | A question typed straight after the intro on 2026-09-05 still gets a scripted reply. |
| 4 | **One thread per member, with a "new conversation" control and date breaks — no thread list, no history sidebar.** | Medium-high | NN/g: site chatbots are used for quick answers, not conversations; the six conversation types are mostly one-shot "search queries". A thread list is ChatGPT-shaped, not desk-shaped. Only the last ~10 turns reach the model anyway. | By 2026-10-01 members ask to find an old conversation, or the single thread exceeds ~200 messages for anyone. |
| 5 | **Chips come from state, not a fixed pair** — "Help me get set up" only while unconnected; "Walk me through my first trade" once connected; "Send it" / "Never mind" while a draft is parked; none while she's typing. | Medium | NN/g: suggestions are ignored unless they sit by the input and feel useful right now; today the two chips are static and vanish exactly when a new member has no vocabulary (right after the intro). | Chip click-through stays at zero across September, or members keep typing what a chip already says. |
| 6 | **Honest failure states** — say the throttle's real reason, mark a cut-off answer as cut off, render the "not financial advice" disclosure she is told the UI carries, and soften market-open claims (no holiday calendar). | High | Blue: the prompt promises a disclosure the rail never renders (`docs/BRAND.md`'s honesty rule); tiger: a 429 is reported as "say that again in a moment", a dropped stream persists a truncated sentence as her final word, and the clock calls Thanksgiving open. | A 429 on 2026-09-05 still renders the generic line, or the rail footer still reads only "every filing gets a real answer". |
| 7 | **Don't build:** a thread list, cross-session memory beyond the thread, proactive unsolicited messages, voice, attachments-in-chat before the above. | High | HAX G3 (time services to context) and the proactive-messaging literature: unsolicited messages annoy unless narrowly triggered; nothing in the desk warrants it. Attachments are already parked (`docs/IDEAS.md`). | A member asks for one of these unprompted, twice, by 2026-10-01. |
| 8 | **Harden the two red-team mediums after the P0s** — ignore client-supplied assistant turns older than the last hand-off, quote filing titles in the member context, and attach a `spec` only when the coach actually interviewed. | Medium | Red: the client can forge her turns to steer a draft; a filing title lands in the privileged system block on every later turn; a one-line rail filing mints `curated` provenance the build lane treats as license. | Red re-run on 2026-09-12 still lands attacker text in the system block or a `curated` label on an uninterrogated ask. |

Confidence drives size: rows 1–3 and 6 ship first as one small PR each; rows 4–5 are a design
slice with a screenshot before it lands; row 7 is a standing "no"; row 8 rides once the P0s are in.

## What the field says

**Microsoft HAX — the 18 Guidelines for Human-AI Interaction** (primary; the 2019 CHI paper,
validated against 20 products). The ones that bind a chat rail, and where we stand:

| Guideline | Verdict today | Evidence |
|---|---|---|
| G1 make clear what the system can do | ✗ on the ✦ path | `toggleRail` opens without the intro (`moneypenny.ts`); only "Meet Moneypenny ›" plays it |
| G2 make clear how well it can do it | ✗ | the disclosure the prompt assumes (`companion-system-prompt.ts` "the UI renders in the footer") is fetched (`companion.ts` `disclosure`) and never rendered |
| G3 time services based on context | ✓ mostly | she speaks only when invoked; the `?moneypenny=intro` link re-fires on every visit to `/onboarding` while the param stays in the URL |
| G4 show contextually relevant information | ✓ / ✗ | live member context every turn (`companion-context.ts`) — but the chips are static |
| G7 efficient invocation | ✓ | ✦ in the top bar, five entry points; no keyboard chord |
| G8 efficient dismissal | ✗ on mobile | under 860px the rail is fixed full-screen over the nav with one ~20px ×, no Escape, no `role="dialog"` |
| G9 efficient correction | ✗ | no way to cancel or edit a parked draft; no "start over" |
| G10 scope services when in doubt | ✓ | prompt: "say I don't have that" |
| G12 remember recent interactions | ✓ / ✗ | thread persists — per browser, not per member; the model sees the last 10 turns while the pane shows everything |
| G16 convey consequences of user actions | ✗ | "reply send files it" — but the draft is never shown, and any reply files it |
| G17 global controls | ✗ | no clear-history / new-conversation control; `reset()` has no caller |

**Nielsen Norman Group** (site-chatbot and genAI studies; the site is behind our egress proxy, so
these are from their published summaries): *Less Chat, More Answer* (2026) — nine users across
eight site bots: brevity wins, sycophancy and chattiness are the trap, be upfront about limits;
*What Is Your Site's AI Chatbot For? Users Can't Tell* — state scope in the first line;
*Prompt Suggestions* and *Designing Use-Case Prompt Suggestions* — suggestions are ignored unless
placed by the input and useful now; pills work; three to six starters; *Prompt Controls in GenAI
Chatbots* — controls exist to expedite, disambiguate, inspire and follow up; *The 6 Types of
Conversations with Generative AI* (425 logged conversations) — search queries, funneling, exploring,
chiseling, expanding, pinpointing; site bots skew to the first, and "no one optimal length".

**assistant-ui's thread model** (the pattern the handoff README cited): a thread is the unit;
`ThreadList` with `New` creates threads and persists the current `threadId` across reloads. That is
the right shape for a general assistant with many topics; it is more machinery than a desk
sidekick answering "how far along am I?" needs — hence call 4.

**Proactive messaging** (industry practice, HAX G3): context-specific, behavior-triggered, concise,
easy to dismiss — or not at all. Meta caps unsolicited follow-ups to a 14-day window. Nothing in
this desk warrants a message she starts.

## What the teams found

Severity is member impact. Every row cites a code path; "confirmed" means the team traced it.

### Red — attack/defense matrix (adversarial)

| Attack | Result | Sev | Narrowest fix |
|---|---|---|---|
| A1 carry a thread and a parked draft across accounts on one browser | works — `sc.moneypenny.v1` is per browser, `/logout` never clears it, so member B files A's draft under B's name and reads A's thread (equity, P&L she recited) | High | key storage by member; don't persist `draft` |
| A2 file text the member never saw, off a reply that says "no" | works — the draft is never rendered; `send()` files on any reply; the coach pass rewrites it after consent | High | render the draft as a message; file only on `SEND_AS_IS`; show what the coach shaped before posting or label it |
| A3 forge her own turns | works — `parseMessages` accepts client `role:"assistant"`; nothing is server-persisted | Med-high | ignore client assistant turns older than the last hand-off, or sign them |
| A4 persistent injection via a filing title into the system block | works (self-scope) — a 200-char title is read back into `memberContext` on every turn | Med | quote/escape titles; label the block as untrusted member data |
| A5 mint `curated` provenance on an uninterrogated ask | works — `shape()` always says "finish", any `spec` earns the label | Med | attach `spec` only when `readiness` is spec-complete and the coach asked ≥1 question |
| A6 spend | 40 req/10 min/member × up to 4 model calls each; in-process counter resets on deploy | Low-med | count model calls, not requests |
| Held: SSE forgery (D1), cross-member reads (D2), order placement (D3), XSS (D4), unauthenticated route (D5), hostile hand-off payload (D6) | defenses confirmed | — | — |

### Blue — correctness (confirmed unless noted)

1. A failed `/api/feedback` POST leaves `flow` in `fb2` with no draft, so the very next message files an **empty-titled** issue via the scripted path — forever (`moneypenny-filing.ts` failure branch never resets flow).
2. A stale draft files the member's next unrelated question, even tomorrow's — contradicting the prompt's own "the draft waits".
3. A message sent during a stream is silently dropped (`typing` clears on the first delta; `show()` replaces the last message) and starts a second concurrent stream.
4. Thread and `introDone` survive sign-out on a shared browser (same as red A1).
5. The disclosure is fetched, typed, and never rendered.
6. One transient `/api/companion` failure caches `companionEnabled:false` for the session.
7. `?moneypenny=intro` re-opens the rail on every remount while the param persists.
8. `moneypenny · typing ···` is lowercase against the "name is always capitalized" rule.
9. No spec covers: a failed POST and the flow after it; a reload with a persisted draft; a send during a stream; the cached companion flag.

### Tiger — the member journeys (top eight, ranked)

1. Shared browser leaks the thread and misfiles the draft (critical; = A1).
2. Any reply files the parked draft (= A2, blue 2).
3. A real question right after the intro is answered as a "no" by the scripted setup beat.
4. ✦ opens a blank rail — the worst first impression in the product.
5. Send during her reply eats the message (Send stays enabled; composer clears before the guard).
6. 429 and a dropped stream lie: "say that again in a moment" retries into the same window; a truncated sentence persists as her final answer.
7. Mobile: the rail covers all navigation with one 20px ×.
8. Market-open claims without holidays, from two different clocks (client intro vs. server context); an Intl failure reads as "open".

Also found: `MAX_TURNS` and `TURN_LIMIT_MESSAGE` are unreachable (the client sends at most 10 turns) and point at a route that is now a form-less ledger; a reload mid-stream loses her answer; relative ticket links she emits (`/trade?play=…`) render as dead text since `linkify` anchors only `https?:`; localStorage quota failure is silent; no date breaks between days.

## Purple — the fix batches

**P0 — consent and identity (one PR, ship first).**
- Key `sc.moneypenny.v1` by the member (an opaque id from `/api/onboarding`), clear on a different member, never persist `draft`.
- Render the draft (title + details) as her message when the hand-off lands; file only on `SEND_AS_IS`; any other reply keeps the draft parked and goes to her; add "never mind" / "cancel" as the exit; reset `flow` on a failed POST.
- Streaming lock: a separate `streaming` flag gates `send` and the Send button; `show()` splices by remembered index.

**P1 — the first minute (one PR).**
- ✦ opens with the intro on an empty thread; "hi again" + a date break on a returning one; a "new conversation" control (calls the existing `reset()`).
- The setup beat catches only a clear yes/no; the rest goes live. Chips from state; hidden while she types.
- Capitalize the typing line; strip `?moneypenny=intro` after firing.

**P2 — honesty (one PR).**
- Render the disclosure in the composer footer. Surface the caught error's message on 429/off; append "— cut off" to a stream that never sent `done`. Soften market copy ("the regular session should be open — the desk confirms with Alpaca before any fill") and take the intro's clock from the server. Retire `MAX_TURNS`/`TURN_LIMIT_MESSAGE` or re-point them. Anchor relative ticket links.

**P3 — hardening (after P0).** Red A3, A4, A5, A6 as listed.

## Sources

- Microsoft HAX Toolkit — Guidelines for Human-AI Interaction (G1–G18): https://www.microsoft.com/en-us/haxtoolkit/ai-guidelines/ (library: https://www.microsoft.com/en-us/haxtoolkit/library/?content_type=guideline)
- NN/g — Less Chat, More Answer: https://www.nngroup.com/articles/less-chat-more-answer/ · What Is Your Site's AI Chatbot for? https://www.nngroup.com/articles/site-ai-chatbot/ · 10 Guidelines for Designing Your Site's AI Chatbots: https://www.nngroup.com/articles/ai-chatbots-design-guidelines/ · Prompt Suggestions: https://www.nngroup.com/articles/prompt-suggestions/ · Designing Use-Case Prompt Suggestions: https://www.nngroup.com/articles/designing-use-case-prompt-suggestions/ · Prompt Controls in GenAI Chatbots: https://www.nngroup.com/articles/prompt-controls-genai/ · The 6 Types of Conversations with Generative AI: https://www.nngroup.com/articles/AI-conversation-types/
- assistant-ui — Threads and ThreadList: https://www.assistant-ui.com/docs/runtimes/concepts/threads · https://www.assistant-ui.com/docs/ui/ThreadList
- Team transcripts: red-team, reviewer (blue), and journey walkthrough (tiger) agents, 2026-09-03, against commit `53ad7f1`.
