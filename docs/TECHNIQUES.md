# Techniques & research discipline — the detail behind the Orient default

The `Orient` output style (`.claude/output-styles/orient.md`) carries only the compact spine that must
fire at the top of a task. This doc holds the depth it points to: how to price a technique, and how to
research and adopt without being tainted by noise. Read the relevant section when a task actually needs it;
don't load it wholesale.

## Pricing a technique — rigor = reversibility × blast-radius × uncertainty

No technique is free. Spend rigor only where it protects the outcome; rigor spent off the constraint is
waste (Theory of Constraints). Cynefin picks *which* technique; the rigor formula picks *how much*.

| Task profile | Right move | When it's overkill |
|---|---|---|
| Familiar, reversible, small (Clear) | Just do it; skip ceremony | — |
| Unfamiliar tech/approach (Complex) | **Spike / research-first**, time-boxed (~10–15% of effort), then plan | When it's Clear — a known SOP applies |
| Delegated by a non-expert | **Probe blindspots / elicit constraints** (paraphrase-confirm always; options-they-can-judge for high stakes) | Routine, reversible, fully specified |
| Irreversible, high-consequence (one-way door) | **Pre-mortem** at the outset + plan-first + Eric's gate | Reversible two-way door — decide fast, correct later |
| Checkable output, error-cost matters | **Independent review** — a fresh-context pass that sees only the diff + criteria | A deterministic test already covers it — run the test |
| Auth / input-parsing / spend / outward-facing | **`/security-review`** + Eric's gate | Internal, reversible, no boundary touched |

Load-bearing caveats from the research:

- **LLMs can't self-correct reasoning without external signal** — self-critique with no test/ground-truth
  can *degrade* output ([arXiv 2310.01798](https://arxiv.org/abs/2310.01798)). Any review/critique earns
  its cost only when anchored to something outside the model (a test, a spec, tool output, a fresh
  context). This is *why* the self-correcting loop must be evidence-triggered, and why a reviewer gets the
  diff + criteria, not the author's reasoning.
- **A reviewer told to "find gaps" manufactures them**, driving over-engineering. Scope every review to
  "correctness and the stated requirements; everything else is optional" (Anthropic, best-practices).
- **More critics ≈ majority voting, and long debates drift.** N independent critics rarely beat simple
  self-consistency at equal cost; multi-round debate wanders off the question. Prefer one well-scoped
  review, or sample-and-vote on a checkable answer — not orchestrated debate machinery.
- **Pre-mortem's power is largely social** (letting dissent surface); an agent has no such reluctance, so
  expect a smaller effect than the human literature's figures — use it for the *reframing* ("assume it
  failed — why?"), not as ceremony.
- **Bounded, not unbounded.** Time-box research (spike hygiene). "Research everything" is analysis
  paralysis; "research the surface you're touching, exhaustively" is the bug-preventing version.

## Research discipline — primary sources over slop

The internet is noisy; aggregated research can taint results. Weight accordingly.

- **Visionaries set the north star; feedback adjudicates the tactic.** This repo reasons *from* Gene Kim
  (Three Ways), Goldratt (ToC), Jocko Willink (Extreme Ownership). Hold the north star firmly even before
  the deeper *why* is understood; hold tactics loosely and let pain/feedback teach the why. When good
  evidence seems to *conflict* with a visionary's principle, first check whether it's *revealing the why*
  rather than rebutting it (e.g. "a self-improvement loop needs external signal" is the mechanism behind
  Kim's Second Way, not a rebuttal of it).
- **Source hygiene.** Prefer primary sources and proven authorities over listicle-slop. Label authority
  when it matters ([official] / [research] / [practitioner opinion]). Treat confidently-worded summaries
  with suspicion — a fetch-and-summarize pass in this repo's own research once hallucinated a comparison
  table that wasn't in the source.

## Tool documentation is the authority

Acting on a *mental model* of a tool instead of its actual docs is a recurring, expensive miss (a
`secrets[format(...)]` GitHub-Actions lookup designed from intuition; a context7 answer nearly given from
memory). The rule:

- A tool's **documentation is the authority** — never a memory-substitute, never a skim that misses a
  constraint. Verify the specific API / flag / limit before relying on it.
- Reach for **`context7` (official-docs MCP) and the vendor's own docs before WebSearch** for any
  library / framework / CLI / service question — even ones that feel known; training data lags.
- **Exhaustive for the surface you touch** (every flag, limit, failure mode of the specific integration),
  scoped to the integration at hand — not the entire product. This prevents the bug without stalling.

## Adopt elegant existing solutions — but read the docs first

Prefer leveraging a proven tool that already solves a problem elegantly over building bespoke — `/charter`'s
"check for an existing owner first," extended outward. Adopt when it solves a *present* problem at low +
reversible integration cost; be wary of shiny-tool-chasing (speculative adoption that adds dependency and
maintenance surface). **Adoption is gated on reading the tool's actual integration docs** — its real limits
and failure modes — not its landing page.

## Structure and intent are different substrates

Route structural questions ("what depends on what / what breaks") to the **Graphify** graph; route intent
questions ("why does this exist / what taste governs it") to the memory layer (CLAUDE.md, `docs/`,
`LESSONS.md`). "Complete awareness" needs both; neither is exhaustive alone. Pair intent to structure by
**co-location first** (the *why* recorded next to the *what*), a separate cross-link index only for
cross-cutting intent that can't be co-located.
