# The AI-engineering progression curve — and where this repo sits on it

_Researched 2026-08-17 at Eric's direction ("I feel like the postmaster is on the AI progression
curve… research this topic, and apply lessons"). Primary sources only; the SEO layer around this
topic is thick and was discarded. Companion to [`docs/TECHNIQUES.md`](../TECHNIQUES.md) and the
postmaster (`scripts/postmaster.mjs`)._

## The curve — real, but telescoped

The phases are genuine practitioner coinages with named authors and dates, but they overlap
heavily (the whole curve spans ~2023–2026), and "harness" and "loop" engineering are two lenses on
the same layer: **harness = the static infrastructure, loop = the dynamic cycle design.**

| Phase | When | Anchor sources | Problem it solved | Its ceiling |
|---|---|---|---|---|
| **Prompt engineering** | ~2020–2023 | Gwern's GPT-3 "prompt programming"; Willison's defense (Feb 2023); swyx's [Rise of the AI Engineer](https://www.latent.space/p/ai-engineer) | Getting one completion to do the right thing at all | One-shot; no state, no tools, no reliability |
| **Context engineering** | mid-2025 | Tobi Lütke (Jun 2025), Karpathy's endorsement; Anthropic's [Effective context engineering](https://www.anthropic.com/engineering) (context as a finite resource); Cognition's "Don't Build Multi-Agents" | Production apps where the prompt is a sliver of the window (history, retrieval, state) | Still per-inference; silent on multi-step action |
| **Agentic engineering** | Dec 2024–2025 | Anthropic's [Building effective agents](https://www.anthropic.com/research/building-effective-agents) (**workflows vs. agents**); Willison's "an LLM agent runs tools in a loop to achieve a goal" | Multi-step autonomy with tools | One agent, one session, hand-babysat |
| **Harness engineering** | Nov 2025–2026 | Anthropic's [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents); [Hashimoto](https://mitchellh.com/writing/my-ai-adoption-journey) ("engineer the harness so it can never make that mistake again"); [OpenAI's Harness engineering](https://openai.com/index/harness-engineering/) (1M lines, ~zero hand-written code) | Reliability at scale: the *environment* carries correctness so the stochastic model can't drift | The next section |
| **Loop engineering** | mid-2026 | [Osmani](https://addyosmani.com/blog/loop-engineering/); Steinberger ("designing loops that prompt your agents"); Boris Cherny ("My job is to write loops") | Removing the human from the prompting seat: discovery, dispatch, verification, persistence as designed systems | — |

## The harness/loop checklist (the phase's design principles)

1. Deterministic outer loop, stochastic inner step — workflows where the path is knowable; model judgment only where needed.
2. Decide-then-do: pure decision logic split from side effects.
3. **The verifier is the bottleneck, and must be independent** — a self-grading agent praises its own work.
4. Tool design is API design (SWE-agent's agent-computer interface).
5. Every agent mistake becomes a permanent harness fix, not a memo.
6. Agent-legible environment: specs as text + mechanically enforced rules.
7. State outside the context window (git, files); every session resumable; **progress artifacts need a supervisor that reads them**.
8. Locks and idempotency; duplicate triggers collapse to one action.
9. Event-driven wakeups; one canonical path, never parallel trigger paths that drift.
10. Receipts: an audit trail readable by humans *and* the next agent.
11. Human gates only at irreversible points; humans as async bottleneck-removers.
12. Budgets and stop conditions; garbage-collect failed attempts.

## Scorecard: the postmaster against the checklist (2026-08-17)

**~8.5/12 at review time — ahead of the discourse on architecture, behind it on observability and
supervision.** Strong: 1, 2, 4, 5, 6, 9, 11 (the `route()`/`execute()` split, the double-fire
pinned as a spec, the flip kept structurally out of the machine's reach). The three named gaps,
**all applied same-day** in the hardening pass:

- **Fail-open dependency gathering (gap → fixed).** `gatherDeps` swallowed errors into `[]`, so a
  failed `gh issue list` was indistinguishable from "no open issues" — silently re-arming the exact
  duplicate class the router was built to kill. Now fails closed and loud.
- **No receipts on the sweep path (gap → fixed).** Only imports left a durable record. `execute()`
  now writes a per-run receipt of every intent to the workflow step summary.
- **A mouth but no eyes (gap → fixed, inert).** Nothing watched whether dispatched work ever moved.
  `audit(deps) → Intent[]` — the same pure, fixture-specced shape — flags `executing` handoffs gone
  quiet and dispatch issues nothing claimed. Ceiling-capped on purpose: it comments and warns, never
  reclaims a lock; judging a stalled build dead is judgment, and judgment goes to whoever the
  comment summons. Wiring (an hourly `--audit` schedule) rides the cutover workflow PR.

## Where the curve points next — and this repo's next unit

The credible signals converge on **fleet coordination + autonomous verification** ([Lopopolo on
Latent Space](https://www.latent.space/p/harness-eng): a supervisor that "spins up, supervises, and
reworks agents across tickets," humans reviewing async; Karpathy's spec → verifier → environment
stack). The postmaster plus its auditor is the front door and the watchdog; the fleet phase would
let the auditor's findings *dispatch corrective sessions* rather than just comment. That step
widens the autonomy envelope, so it is Eric's call, not a default.

_Full source list in the research transcript; the load-bearing ones are linked inline above._
