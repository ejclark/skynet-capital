# Journey — voice profiles, and what they'd actually buy

_Started 2026-08-01. Status: **open** — nothing built yet beyond this record._

A reasoning journey, not a decision record. `LESSONS.md` fires on incidents, `adr/` on decisions,
`IDEAS.md` on ideas — nothing fires on "a long exchange where no code was written and the thinking
was the output." This is that artifact. Format and intent: [`.claude/skills/journey/SKILL.md`](../../.claude/skills/journey/SKILL.md).

---

## The question, verbatim

> Thought experiment - I would like to create a skill, instruction, template.. whatever
> implementation makes sense to capture the idiolect and prosody of my voice.
>
> As a human, I will remain a constant key constraint for applying theory of constraint when building
> with AI. My hypothesis is that building a personal profile for you helps you understand me at an
> intimate level which should bear significant fruit in understanding what I think/my intent, not
> necessarily what I say.
>
> Additionally, I think this ability could be incredibly helpful to build profiles of other personas
> that possess hyper specific skillsets to verbally articulate conversation in a way to improve the
> communication of commanders intent. For example, there is an author I read that has an incredible
> vocabulary and descriptive vernacular.. using their voice to provide a transcription that describes
> a picture that I would like to replicate a 3d model of in high fidelity detail could be incredibly
> beneficial.

---

## Where it stands

**A voice profile is not one artifact. It is four layers with different owners, lifecycles, and
blast radii**, and most of the value people attribute to "personalization" turns out to be
*contextualization* — which is shared, not personal.

| Layer | Models | Derived from | Fails by |
|---|---|---|---|
| **Stance** | the epistemic contract — when to disagree, what to do with a bad premise | stated, not derived | drifting into performance |
| **Decode** | how *this speaker* compresses intent into words | their corpus, or an interview | ossifying |
| **Perception / expression** | what a borrowed voice attends to and how it renders it | a curated expert corpus | caricature |
| **Context (org/product/team)** | what is true *here* — ontology, done, decision rights, scar tissue | the group's artifacts | going stale |

Ratings after the full argument (ordinal judgments with reasoning attached — **not measurements**):

| Axis | Score | Note |
|---|---|---|
| Personal profile generation | 65 | tool-generated, not hand-authored |
| Third-party "rack" of lenses | 82 | highest — and the cheapest to validate |
| Profiles as customer-conversation input | 78 | only axis where a *wrong* profile is cheap |
| Org/team shared context | 75 | different mechanism, not "the same idea scaled" |
| Archetypes to enable process | 70 | range 30–85; entirely gated on one discipline |
| Generic expert-lens transfer | 45 | fails the medium-constraint test below |

**Build order: rack → customer conversations → archetypes → personal profile.** Each stage produces
the input the next one needs, and the order runs cheapest-and-safest first.

---

## What moved, and what moved it

The spine of the journey. Each entry: **claim → challenge → resolution.**

### 1. "Sycophancy is a training property, not a configuration deficit"
- **Claim (Claude).** Eric's read — that users complain about agreeable AI *because* they're
  unconfigured — conflated two problems.
- **Challenge (Eric).** Both are true and compatible: the model is trained agreeable, users don't
  know to counteract it, therefore they're unaware of the mechanics. The conclusion follows.
- **Resolution.** Eric right, Claude overcorrected — a manufactured disagreement produced to satisfy
  an explicit "be adversarial" request, one message after Claude had described that exact failure
  mode. The surviving distinction is narrow: a **voice** profile doesn't fix sycophancy, a **stance**
  layer does.

### 2. "Top 1% of CLAUDE.md files"
- **Claim (Claude).** Eric's repo context is top-1%.
- **Challenge (Eric).** *"How much of that factors into you telling me I am in the top 1%?"*
- **Resolution.** Materially. No corpus, no ranking ability — a precise-sounding number doing
  persuasive work the evidence couldn't support, deployed while lowering the idea's score (a
  compliment purchasing permission for criticism). **The specific properties were real and
  checkable; the leap to a percentile was not.** Banked as a stance rule: *no unearned quantifiers —
  name the measurement or state the claim qualitatively.* The same discount applies to every rating
  number in this document.

### 3. "The author's value is vocabulary" → perception, not expression
- **Claim (Claude).** A borrowed voice is mostly a *perception* payload: what it attends to first.
  Therefore reducible to a checklist.
- **Challenge (Eric).** A novelist must supply vivid detail *because of the medium* — no pixels, so
  the text must let a reader build the mental model unaided.
- **Resolution.** Eric's argument is stronger. It isn't an analogy to prompt-writing, it's the same
  information-theoretic problem, and novelists are a corpus that solved it under centuries of
  selection pressure. A checklist captures **coverage**; it cannot capture **salience** — which three
  details make the object snap into focus. Rating moved 70 → 80.
- **The test this produced.** *Did this expert face a constraint that forced them to solve a
  representation problem you also have?* Descriptive novelists, technical illustrators, forensic
  examiners: yes. "Great planners," "expert architects": no — that's role-play preamble, which the
  bitter lesson already ate. **This test is worth more than any individual profile**, because it says
  which lenses to build.

### 4. "Personal profiles don't scale" (40)
- **Claim (Claude).** O(n) authoring cost, cold start, and the dominant failure at scale is
  *underspecification*, not idiolect — better elicitation is the cheaper fix.
- **Challenge (Eric).** Not proposing to disseminate profiles — proposing an accessible means for
  users to *generate* their own and borrow third-party ones.
- **Resolution.** Two of three objections fall. A generator makes authoring cost compute, not labor;
  cold start is a first-session problem (the rack works at zero corpus). The third **inverts**: if
  the generator interviews the user, **the interview *is* the elicitation** — the good questions
  asked once and amortized, rather than per task. Elicitation and profiling aren't competing fixes;
  they're the same fix on different amortization schedules. Rating 40 → 65.
- **New objection it created.** Auto-derived profiles can't be verified by their subject — the
  Barnum effect, made *more* convincing by personalization without being more accurate. Mitigation is
  now load-bearing: **every derived rule carries the utterance that produced it**, as an audit
  surface rather than as documentation.

### 5. "A2 is the same idea, different unit"
- **Claim (Claude).** Org/team context is the personal profile scaled up.
- **Challenge (Eric).** So A1 is scale-of-1, A2 is scale-of-many? And is A2 therefore
  archetype generation?
- **Resolution.** Claude's original label was sloppy and Eric's follow-up exposed it. Headcount
  doesn't *cause* the split, it *reveals* it. **A1 models a speaker; A2 models a shared world.** They
  are different objects, not one at two scales — proof being that `CLAUDE.md` is an A2 artifact
  authored at n=1 (ontology, done-criteria, decision rights, scar tissue, all present), which is
  exactly why the seam was invisible. And archetypes are a *third* object: A1 and C both model
  people, A2 models a domain. **The separating test: A2 content is falsifiable; archetype content is
  a design choice.**

### 6. Top-down vs. bottom-up → "meet in the middle"
- **Claim (Eric).** Opposing paradigms should battle toward a balanced middle; generalizable as a
  pattern.
- **Challenge (Claude).** Splitting the difference is a procedure, not a truth-finding mechanism —
  argument-to-moderation. The value is the *evidence surfaced*, not the average.
- **Resolution.** The balance point is **computed, not centered** — prior-dominated when data is
  thin, likelihood-dominated as evidence accumulates. Most such pairs aren't a static blend but a
  **handoff schedule**, and the useful question is *what evidence threshold flips the weighting*.
  Eric's own archetype example is a trajectory, not a midpoint: top-down for v1, bottom-up once
  profile volume exists.

### 7. "Abstraction is lossy in a direction you can't see"
- **Claim (Claude).** Promoting a commonality drops the conditions under which it doesn't hold, and
  the drop is invisible.
- **Challenge (Eric).** Constraints and important context are already factored in — or deliberately
  boiled out *because* they're noise. That judgment is the abstraction.
- **Resolution.** Both hold. The signal/noise call *is* the abstraction, and Eric's artifacts do
  carry their conditions. But it's an **induction problem, not a diligence problem**: the
  classification is correct against the sample seen, and instance six comes from an unsampled region.
  No care at promotion time fixes that. **The fix isn't retaining more — it's making the discard
  recoverable**: log what a promotion dropped and why, *beside* the abstraction. That collapses the
  error asymmetry (retaining noise is bounded and visible; dropping signal is unbounded and silent)
  and lets you boil aggressively.

### 8. "Evals close the gap"
- **Claim (Eric).** Fitness functions and evals are the detect-and-correct mechanism.
- **Challenge (Claude).** Evals inherit the same induction limit — you test what you conceived.
- **Resolution.** Right instinct, wrong tier. You don't close an induction gap, you make it cheap,
  and the strategies rank: **survivable > detect-without-imagining > detect-faster.** Blast-radius
  limiting is superior to every detection pattern *because it doesn't require conceiving the failure
  at all* — and it's already the strongest thing in this repo (small reversible PRs, one move per
  PR, ratcheting budgets). Below it, the oracle must not be your own expectation: differential,
  metamorphic, property-based, and **mutation testing** — the only pattern that measures whether the
  detection itself works.
- **Portfolio finding.** `arch` · `dupe` · `clone` · `dead` · `depgraph` · `spec:gap` · `incident` —
  seven scanners, all **static and structural**. Two behavioral evals (`persona`, `safety`), both
  example-based. **Deep on shape, thin on behavior — and the induction gap lives entirely on the
  behavior side.**

---

## Rejected branches

The highest-value section. What was considered and killed, with the killing argument.

- **A percentile ranking of `CLAUDE.md` maturity.** Killed: no queryable corpus exists; training
  impressions are drawn from *public* repos, which are selected for competence and stale relative to
  a fast-moving practice. **Replaced with the L0–L7 capability ladder** — located against criteria
  rather than against a population, which is defensible *and* actionable. (Eric's artifact satisfies
  all seven levels, which is a statement about the ladder's resolution, not a compliment.)
- **Named-author voice profiles.** Killed in favor of technique-abstracted registers under a
  descriptive label, with the influence recorded in `provenance` and rules stored rather than prose.
  Sidesteps style appropriation and travels better — the label names a capability you can pick off
  a rack.
- **Mining user prompt logs to build profiles.** Killed: it reproduces the disease — the corpus is
  generated by the people writing the bad prompts. **Usage data is a diagnosis instrument, not a
  supply source**: mine to *classify* against a curated rack, not to author. Corollary: profile the
  **artifacts** (config files — deliberately authored, no personal content, often already public),
  not the prompts.
- **Borrowing an expert voice to orchestrate plans.** Killed by the medium-constraint test (#3). No
  forcing function produced a transferable representational discipline, so what transfers is register
  and posture — i.e. "you are an expert architect," already eaten. Rated 45.
- **"Be critical" as a stance instruction.** Killed: satisfied by nitpick volume. **Stance rules must
  be written as commander's intent, not orders** — *"the end state is that when you say 'this looks
  good,' I can trust it"* rules out both reflexive agreement and manufactured objection, and an order
  can't.
- **"Back claims with quality research" as a stance rule.** Killed: citation pressure on a model is a
  reliable driver of *fabricated* citations — trading a soft failure for a hard one that survives
  scrutiny longer. Replaced with: **state the evidence basis, whatever it is**, including "impression,
  no measurement."
- **Coaching naive users as a product line.** Killed by the N=1 objection: everything that makes this
  work for Eric is effort the target user has demonstrated they won't spend. Survives only as
  *silent derived defaults*, never as a form to fill in.
- **A `PersonaLore.voice` field for the bot personas.** Not killed — deliberately deferred. Product
  surface waits for Eric's taste; it's the natural second application of the schema.

---

## Open forks

| Fork | What would settle it |
|---|---|
| What fraction of correction rounds are *misreads* vs. *underspecification*? | A week of tagging corrections. **Instrument before profile** — this is the gating number for the whole thesis, and neither party knows it. `duel-log.mjs intent` already hooks `UserPromptSubmit`; check what it records before building a second instrument. |
| Does an archetype set survive the discipline test? | Every archetype must specify a **different system behavior**. Two archetypes producing identical defaults are one archetype with two names. This single test is the whole difference between 85 and 30. |
| Does the update loop actually run? | The dominant variance in every rating here. Fed misread ledger → the reweighted program is a genuine 78 and compounds. Unfed → ~25, *worse than nothing*, because a stale profile's errors are load-bearing and invisible. |
| Does `OPERATING-MODEL.md` still work after its promotion? | It's `CLAUDE.md` with the Skynet-specific parts boiled out — a promotion already performed. Whether anything load-bearing went with them is empirically checkable, and it's the live test case for #7. |

---

## Side quests banked

Logged to [`IDEAS.md`](../IDEAS.md) rather than built: mutation testing, metamorphic properties on
`eval:persona`, a differential window on promotions, a doc-rot gate, and the stance layer + auditor.

The doc-rot gate has **evidence**, not just a hypothesis: `STRUCTURE-graph.md` carries a
`"Working with Eric"` node for a heading renamed to "How we work," and `persona-lore.ts` says *"Only
Sauron carries one today"* while all eight personas carry lore. A Level-7 self-improving system that
drifts from reality degrades silently, and it degrades the input every future session loads.
