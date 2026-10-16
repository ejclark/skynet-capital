# Eric's design decision rules: back-tested

Eric, 2026-10-16: "Context to 30 more sessions. That is a lot of high value feedback about my taste and thought process to gleen; the type of info that is gold for replicating the decision logic i would make - ideal for automation engineering." On the back-test: "Back test- now we're talking."

**What these rules may do, decided by the back-test, not by taste:**

| The call | Confidence | Why | Wrong if |
|---|---|---|---|
| **Use the rules as the critic's checklist** before a frame reaches him | medium-high | Rules written only from his words before 2026-10-13 anticipated **33 of his 68** later page notes (49%; bar set in advance: 33%), plus 15 partial | By 2026-11-15, a re-run on rounds after 2026-10-16 anticipates under 33% |
| **Never use them to pick Build for him** | high | On Build vs More of this they scored **21 of 33 (64%)**, below always guessing More of this (24 of 33, 73%). They over-call Build on single-shape confirm rounds: 11 of 12 misses | A re-run beats the always-More baseline by 10 points |
| **Expect More of this on a first drawn round** | medium | Train: Build lands in a later round once the question is down to one change (5 of 6 screens), rarely in the first drawn round (2 of 9). #5451 rounds 1–2 went the same way | His next three screens Build on their first drawn round |

**How it was run** (pre-registered before any rule existed; protocol and amendments in the PR that added this page):
- Sources: 252 of his messages harvested from 59 sessions, plus 76 GitHub read-backs quoting his picks and notes. Cut at 2026-10-13: 137 messages and 39 read-backs before it trained the rules; 40 picks and 68 notes after it tested them.
- A separate agent wrote the rules from training data only. A second, blind agent predicted. A script scored against a held-back answer key, and a third agent graded notes strictly (same element, same direction).
- **Run 1 was voided:** 39/40, but the read-back format differs by label (Build, More and Not lines are shaped differently), so the predictor read the shape, not his taste. Run 2 cut items to option names only. Not this was untestable, because those lines carry no option name.

**What the rules missed** (the "no" notes, by theme). The next re-run checks these first:
1. **Whether a signal can be trusted:** "What is the feedback/singals that indicates this isn't a sinking ship".
2. **The review page itself getting in the way:** "the section content I am supposed to evaluate is covered up by the scenario text".
3. **Order, and what is settings versus what is the path:** "the latest event (sold) should be listed first"; on #5451, Subscribe then pick the account, size "gets setup after subscibing, hidden before."
4. One rule pointed the wrong way: R22 (timeline over calendar). He asked for calendars in the test period.

**Keep it current:** every read-back banks his words (`docs/design/eric-feedback/`). Re-run the back-test with a new cut when about 40 new picks have accrued, and update the table above with the dated result.

---


## 1. Decision rules (ranked by predictive weight)

**R1. When a design carries its message as prose (paragraphs, text blocks, "four quadrants" of text), he marks it down and asks for a picture; when it draws the thing (diagram, chart, drawn bet), he gives More / 👍.**
- "I dislike the walls of text; I like the callout to drive communication through pictures/visualizations." (2026-10-11, #5163 r0)
- "I like expanding on the context of the bet, why, if wrong, the cash.. I don't like the wall of text in 4 quadrants format." (2026-10-11, #5160 r1)
- "I really like the imagery drawn with the diagram to frame the state of the position; so much better than raw text" (2026-10-09)
- "Ideally, plays in the playbook are visually appealing with minimal text required" (2026-10-09); "The visual diagrams/pictures make content easier to synthesize/absorb." (2026-10-09)
- Obs: ~10 (5037 r1 Q1/Q5, 5160 r0/r1/r2, 5163 r0/r1, 5168 brief, 10-10 "I like the graphics"). Counter: none. In #5160 r2 "The bet, drawn" got 👍 on every pin while text rows got ☯. **High.**

**R2. When a design lays data out as an aligned table / ledger / labelled rows with consistent columns, he likes it; when the same data is loose cards or free text, he asks for "more tabular structure".**
- "I like the tabular highly structured view for the list. It lets me quickly observe the current state, what is changing" (2026-10-10)
- "Same amount of lines but tabular structures can be synthesised in a fraction of the time" (2026-10-11, #5176 r2)
- "I wish data had more tabular structure or more pictures/visuals to easily read/parse/synthesize." (2026-10-11)
- "I like the 'leger' style structure when preparing to execute." (2026-10-11, #5174 r2); "The spreadsheet of strike price with premiums and greeks provides an excellent vantage point" (2026-09-21)
- Row spec: "These values should be aligned within the position. These values should be aligned with other rows" (2026-10-09)
- Obs: ~8. Counter: "the tabular preservation of this view as an option but really depends on the objective" (2026-10-09) — tables are liked, not automatically Built. Desktop "cards" option got 👎 (#5160 r9). **High.**

**R3. When a design shows everything at once (big charts inline, many icons, full detail open by default), he asks for progressive disclosure: a compact list/primary content first, detail one tap away. The calmer/more reduced option wins over the fuller one.**
- "I absolutely love the charts in this view but it also takes up a ton of real estate. I propose that we apply progressive disclosure here. The initial view should render the list view" (2026-10-10)
- "there are too many icons available all the time ... Progressive reveal to elevate what's important" (2026-10-09)
- "I really liked reducing down to the primary content." (2026-10-10; Build "Level 2 · calm", More "Level 3 · minimal", Not V1)
- "I like the fog of war pattern to retain focus through account setup" (2026-10-12; Build C "One step at a time")
- "I like the structure where more features are being pushed into drawers/section where they belong" (2026-10-10)
- Obs: ~8. Counter: he loves the rich charts themselves ("contenders for addition") — he wants them behind a tap, not removed. **High.**

**R4. When a design element is pretty but not actionable, or shows numbers that don't bear on a decision, he demotes it; when it surfaces the decision numbers (capital at play, total gain/loss and ROI, expected outcome / confidence, available cash) with guidance on what to do, he likes it.**
- "this information is a really cool visual but is not actionable and taking prime real estate." (2026-10-09)
- "ultimately I need information to be organized and distilled down to the brass tax to make informed desicions. We need guidance" (2026-10-10)
- "The most important numbers ...: amount of capital [at play or to free up], the gains/losses [which provides relative ROI], sentiment/expectations" (2026-10-09)
- "total gains/losses on a position is more important than today's gain/losses." (2026-10-09); "I like seeing the available balance on the account. The cash after seems less important" (2026-10-11)
- "Making cash visible ... having guidance on possible opportunities to 'find a home' to invest the cash" (2026-10-10)
- Obs: ~8. Counter: none. **High.**

**R5. When a design mislabels trading mechanics (wrong zone for ITM, profit colour where there is no profit, contracts vs shares, missing LONG/SHORT CALL/PUT, "right/wrong" framing on an option), he corrects it and the option does not get Build until fixed.**
- "I dislike how ITM is mislabeled for only the premium (ITM is everything left of strike price)." (2026-10-12)
- "Max profit for Cash secured is the premium. Everything above the strike price for puts is just OTM, not green" (2026-10-12)
- "I don't like 'wrong if' - right/wrong don't matter. in the money (ITM) is what matters" (2026-10-11)
- "I wish the 15 was labeled.. shares of stock, not contacts in guessing" (2026-10-12); "the position should include LONG vs SHORT and CALL vs PUT" (2026-10-09)
- Obs: ~7 (5160 r2, r4, r6, r7, r8, r9; 5037 r1). Counter: none. Expect him to inspect every label on a chart. **High.**

**R6. When a design repeats information (the same date on every row, a badge for the account you're already on, a symbol twice, a count shown three ways, an extra nav dimension), he asks for it removed.**
- "i expect redundancy to be reduced/removed." (2026-10-11, #5161 r0)
- "We're already looking at sauron, no need to include the badge." / "I don't like the redundant symbol." (2026-10-12)
- "I thought dates were separated by day with divider lines. That removes redundancy" (2026-10-12)
- "too many navigation/views. integrating daily changes into positions removes/flattens a dimension lowering overall complexity (ideal)." (2026-10-09)
- Obs: 6. Counter: none. **High.**

**R7. When a design groups related things together (a sale with the buy it closed, status beside its text, levels under a shared header, events beside the plan they affect), he likes it; when related items sit apart or unrelated items share a space, he asks to merge or move them.**
- "I wish option C consolidated activities into a wholelistic transaction where possible" (2026-10-11)
- "It would be nice to include structure to associate related transactions." (2026-10-12)
- "I like the status and associated text of the state being grouped together." (2026-10-11)
- "101/102 are buy/selling stocks and can share a combined header." (2026-10-11); "some sections could be combined ... in proximity to associated information" (2026-10-11)
- "I don't like having two cards for unrelated tasks." (2026-10-11)
- Obs: ~8. Counter: none. **High.**

**R8. When a design uses explanatory words where a correct short label or the shape could carry it, he asks for succinct mechanic labels only (ITM, OTM, Strike, Breakeven) and for the visual to imply the rest.**
- "ITM | OTM are sufficient - including 'beyond 80' or 'below 80' is extra." (2026-10-11)
- "keep to succinct labels; ITM, OTM, Strike, break even, etc." (2026-10-11)
- "I wish the design organically called out 'we get to keep either way' without having to state it with text." (2026-10-11)
- "green - should be labeled something closer to profit beyond premium but not so wordy/verbose" (2026-10-12)
- Obs: 4 (all #5160 chart). **Medium-high** (strong but one screen).

**R9. When an element takes a lot of space for little information (tall rows, empty dark calendar, wide gaps on desktop, a top-level column that needs room), he flags real estate. Exception: a control that drives behaviour may get more room.**
- "i don't like how much real estate is taken up" (2026-10-11, #5159 r1); "likely have too much dead space in between on full desktop view; possible design smell." (2026-10-11)
- "the rows feel overly tall" (2026-10-11); "I don't like the overly dark calendar, especailly when a large portion of it is so empty." (2026-10-10)
- "I don't like like the bet column at the top level.. that feels like context that requires more real estate." (2026-10-12)
- Counter/exception: "the date ranges warrants a larger piece of real estate to effectively drive behavior." (2026-10-09, Not on C)
- Obs: 6. **High.**

**R10. When a design is polished, crisp and high-fidelity — especially interactive widgets and animated transitions — he responds with strong positive words ("love"); lo-fi or static where motion would explain a change gets a request for animation.**
- "I really like the visualization details and crisp structure. I love polished high fidelity crispness." (2026-10-10)
- "I love high fidelity interactive widgets for specialized tasks. Simple and effective with a beautiful and delightful experience." (2026-10-10)
- "I like animatinos to blend transition states." (2026-10-10); "animations when changing between week, month, quarter would be a nice touch" (2026-10-11)
- "Animating all edges - this seems SO MUCH BETTER!" (2026-10-07); "one animated edge per picture ... seems like an arbitrary communication constraint." (2026-10-03)
- "leverage the brand/theme to increase fidelity/experience" (2026-10-10)
- Obs: 7. Counter: he treats colour flair as a later layer (R14). **High.**

**R11. When a design shows a control that changes nothing on that screen, or offers features the user can't use in this context (options tools while buying stock, options before unlocked), he says Not.**
- "controls that do nothing is an oxy moron" (2026-10-09, Not on B)
- "i agree with the control only being present where behavior is influenced/driven." (2026-10-09)
- "listing the entire milestone feels excessive unless it is an input that drives form behavior" (2026-09-21)
- "I don't like how features for options are available when 1) 'buying stock' is selected, 2) options trading hasn't been unlocked" (2026-10-11)
- Obs: 4. Counter: none. **High.**

**R12. When wording is vague, too strong, cute, or system-speak ("good for today", "training wheels", "needs attention", lore/jargon), he objects to the word and asks for the plain mechanic.**
- "I don't like 'good for today' verbiage - the verbiage is ambiguous and detached from the configuration" (2026-10-11)
- "I don't like how the trading ladder milestones verbiage 'training wheels'." (2026-10-11)
- "I really like the badge for 'needs attention' but that verbiage feels too strong and/or may do too much projection." (2026-10-09)
- He picked "What the bot believes and is doing is in lore and jargon" as fix-first (#5177 r0); More on "Status in our words, not yours" (#5159 r0).
- Obs: 5. **High** for "he will comment on the word"; low for which replacement he wants.

**R13. When a chart's labels or marks are off-centre, unevenly spaced, or placed where they are not read first (axis labels at the bottom), he lists alignment fixes, one line each.**
- "I wish the price was centered over the break even mark/point. / I wish the break even point labeling was centered. / I wish the strike price was centered" (2026-10-12)
- "I wish current price heading was centered like the other labels" (2026-10-12); "I wish ITM | Strike | OTM were more evenly spaced" (2026-10-11)
- "these should be labeled at the top. The labels in the bottom are not always in view" (2026-10-11); "a subtle divider ... centered with the date text" (2026-10-12)
- Obs: 5. Counter: none. **High** (predicts the comment, not the pick).

**R14. When a design uses strong colour for emphasis that isn't meaning (a glow, a full-width band), he prefers the restrained option and keeps colour for meaning: green only for actual profit, neutral grey for no-profit zones, red for loss.**
- "I really like the intensity of color on option b, just not the right place ... reserve color to add to depth at a later time" (2026-10-10; Build bold outline over orange glow)
- "Everything above the strike price for puts is just OTM, not green (because it doesn't signify profit)." (2026-10-12)
- "The premium is the profit in this particular trade, this should be the solid green to indicate profit." (2026-10-12; Build thin grey OTM line)
- "I do not like '+255 premium' covering the entire visual" (2026-10-11; Not on 2 of 3)
- Obs: 4. **Medium.**

**R15. When a design keeps one uniform frame that does not shift between sections or entries (same head, same template, fixed divider), he likes it; layouts that jump or wrap get flagged.**
- "uniform structure both elevates commonalities that hold across sections and prevents content shift to retain focus." (2026-10-09, Build B)
- "I like the divider and a placement that is reliable/doesn't shift." (2026-10-09)
- #5160 r13 build note (read-back log, 2026-10-13): "one template for every entry, and the days must not wrap."
- Obs: 3. **Medium.**

**R16. When a design hides finished history entirely, he wants it still represented but collapsed (e.g., 1xx/2xx group rows, "101 - earned date"); when it shows every finished item in full, he wants it condensed.**
- "I like aspects of having the next run to unlock ready but not hiding all previous completed rungs... collapsed but still represented" (2026-10-11, #5176 r1)
- "I like all sections remaining represented. If we were to condense, I'd prefer 101 and 102 to be rolled into 1xx, 2xx" (2026-10-11, #5176 r2; Build "finished level as one row")
- Obs: 2 (one screen). Reconcile with R3: hide what isn't reachable yet during a focused task; compress, don't hide, what's done. **Medium (thin).**

**R17. When two distinct concepts share one view or a vague name (transactions vs events, ledger vs transaction log, heartbeat vs playbooks), he names the conflation and asks for a split or a precise name.**
- "I feel we are combining transactions and events which conflates views. We need to outline if we are looking at our ledger or transaction logs." (2026-10-11)
- "had evolved into the ledger. We should rebrand the tab as such - properly named terminology will help ai inference." (2026-10-12)
- "Heartbeat and playbooks at this point have no clear or intuitive association." (2026-10-09)
- Counter: he then reversed which side gets derived data ("with derived insights to enrich feedback", 2026-10-12) — the split stands, the content moves. **Medium.**

**R18. When phone and desktop versions are shown together, he judges the phone frame first and usually likes it more; desktop gets dead-space or density complaints.**
- "I like the mobile design Option R2 with the graph on the second row. I do not like the desktop version as much as the mobile." (2026-10-10)
- "The mobile design really focused on the important pieces of the information architecture" (2026-10-09)
- "likely have too much dead space in between on full desktop view" (2026-10-11)
- Obs: 3. Counter: #5160 r11 header pattern 👍 on desktop while phone was mixed. **Medium.**

**R19. When a design uses a modal or a full page jump, he accepts it only for a focused, risky commit (the recap before placing a trade); for browsing/FYI he prefers in-place, non-modal expansion.**
- "I'd also want to reserve this for the most important tasks.. a 'decision point that incurs risk with recap of the transaction'" (2026-10-09)
- "Probably best if the user wants to dive into a tangent, not as prevalent for an 'FYI'" (2026-10-09)
- Builds favour "tap opens it in place" (2026-10-10 Q1 R2) and "opt-in deep dive: a page on a phone, a side panel on desktop" (Q5). Obs: 4. **Medium.**

**R20. When a design asks the user to act, he wants the action reachable without leaving context: places named in text become links, actions become one card/button, follow-on trades sit inside the same form.**
- "I like the call out to link to places instead of plain text." (2026-10-11); Build "Every place she names is a link" (2026-10-11)
- "If the user determines action is warranted, they are ideally able to act without breaking context" (2026-10-09)
- "I wish any trasactions like selling stocks, buying stocks, rolling options were directly integrated into the form to retain full context." (2026-10-11)
- Obs: 4. **Medium.**

**R21. When a design orders information so the user meets a thing before it has been explained, or puts the first action screens down, he picks that as the problem to fix first.**
- "I like how you are calling out sequencing of features, content and language that the user has not been informed about yet." (2026-10-11; Fix first "first thing to do is 2.3 screens down")
- "I like the commentary about improving sequencing/order of information" (2026-10-11)
- More on "The first screen is page head, not chain" (2026-10-11); Build "Open at the price row" (2026-10-11)
- Obs: 4. **Medium.**

**R22. When a time-based structure (phases, windows, events) is shown, he prefers a single-line timeline with reasons at each boundary over a multi-month calendar grid.**
- "I like the single dimension timeline structure to communicate phases.. for example, decision windows to buy, sell, hold." (2026-10-11; Not on D "two-month calendar")
- "the chart is effectively a timeline which allows for a smooth animation" (2026-10-11)
- "what is the data/reasons behind the date markers on the boundary of each phase" (2026-10-11)
- Obs: 2-3. **Medium (thin).**

**R23. When options are compared, he prefers side-by-side over stacked for line-item comparison.**
- "side by side comparisons are way easier to understand and cross examine at the line item level than top vs bottom" (2026-10-09)
- "A - gives a uniform view to compare and contrast differences" (2026-10-07)
- Obs: 2. **Low (thin).**

**R24. When a design lets a user reach risky features (options, playbook subscription for humans) before the progression or season allows, he objects on domain/policy grounds.**
- "should be unavailable for that user to trade until they have completed the milestone to unlock" (2026-10-11)
- "Note this is a progressive enhancement only available to bot accounts in season one. Season two opens this behavior to humans." (2026-10-11); "For season 1, I'm only allowing bots to subscribe to playbooks." (2026-10-05)
- Obs: 3. **Medium.**

**R25. When shown several options, he usually likes parts of each and asks to combine them rather than crowning one; a note naming "aspects" of each predicts no clean Build.**
- "I like different aspects about A, B, C, E ... B feels more intuitive, but C feels like it has more potential" (2026-10-07)
- "I really like aspects around each of the pictures. I've left comments to call out the pieces to integrate" (2026-10-10)
- "Option b is an example of where I'd like a mixed signal ... i'd like more of a middle ground" (2026-10-11)
- Pin data: ☯ mixed is his modal pin reaction (see §2). Obs: many. **High.**

## 2. Pick model

**Train base rates** (design-shape questions only; round-0 "which problem first" pages excluded):

| Page type | Questions | Build given | Options marked More | Not | Unmarked |
|---|---|---|---|---|---|
| Steering pages (#5037 etc., 10-09/10-10, Claude's recommended option labelled R2/rec) | 18 | 16 (89%) — almost always the recommended option | ~44 | ~9 | few |
| Redesign rounds (design-XXXX-r1+, 10-11/10-12) | 24 | 7 (29%) | 41 (~58% of ~70 options) | 14 (~20%) | ~22% |

- Per option overall: More ≈ 60%, Not ≈ 20%, unmarked ≈ 20%; Build ≈ 1 option per Built question, usually also marked More.
- Pins (89 in redesign rounds): ☯ mixed 39%, 👍 29%, no signal 22%, 👎 9%.
- Round-0 problem picks: he marks More on 3-5 of 5 problems, Not on ≤1; Not is rare there (2 of 11 rounds). He says the More/Not buttons don't fit ranking ("my opinion on the action is not a binary").
- Build timing per screen: first drawn round got Build on 2 of 9 screens; a later round with one narrowed variable got Build on 5 of 6 (5156, 5176, 5159, 5161, 5160 at r8; 5174 still none at r2).

**Procedure.**
1. Default every option to **More of this**.
2. **Not this** if any holds: it is a text wall where others draw (R1); a control/feature that does nothing in context (R11); it mislabels a mechanic (R5); colour/emphasis covering the whole visual (R14); it hides or duplicates rather than compresses (R6, R16); it is the most cluttered of the set (R3). Expect 0-1 Not per question, rarely 2.
3. **Build** one option only if: the question is down to one variable; the option has no ☯-class flaw left (labels correct, nothing redundant, compact); and either it is Claude's recommendation on a steering page (≈always Built) or its pins would be mostly 👍 (#5161 r2: 10 👍 → Build; #5160 r8: Build on the all-👍 option). If his note is a list of "I wish…" fixes, predict **no Build** that round.
4. Leaning: among similar options he Builds the calmer, more reduced, more structured, phone-strong one (R3, R9, R18), and the one that keeps colour for later (R14).
5. Predict his note: one "I like …" (structure, pictures, grouping) plus one or more "I wish / I don't like …" naming a label, a redundancy, real estate or alignment (R5, R6, R9, R13). On chart work, expect domain label corrections.

## 3. What the data can't tell

- **Recommendation effect vs taste.** On steering pages Build ≈ the recommended option; I can't separate "he agrees" from "he defers". Once he overrode it (#5162 r1: rec B, Build C). Model will over-predict Build on steering-style pages if recommendations get worse.
- **Format drift.** Page mechanics changed mid-train (pins + ☯ added 10-11, rounds narrowed to one variable 10-10). Base rates are from a short window (10-09 to 10-12) and a few screens; #5160 alone is 10 rounds and dominates pin stats.
- **Process vs design.** ~60% of utterances are process/infra; the taste signal is ~40 quotes. Rules on 3D/spectacle surfaces, login canvas, leaderboard, and dark-vs-light palettes have almost no data.
- **Contradiction zones.** "Love the charts" vs "takes real estate"; "derived data out of the log" (10-11) reversed to "derived insights in the ledger" (10-12). He changes direction as rounds teach him — later rounds may flip early rules.
- **Silence.** Unmarked options and "no signal" pins (22%) are unexplained: could be indifference, fatigue, or load failures (artifact pages failed to load 10-11).
- **Colourblindness.** He is red/green colourblind; the model can't predict his reaction to hue-only differences beyond "will miss or dislike them".
