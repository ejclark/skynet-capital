# Scenario Navigator — the trading-parity study as a queryable model

**What it is.** `scenarios.json` turns `docs/research/trading-parity-2026-09.md` into seven dimensions
(instrument · action · order type · time in force · stage · device · ladder), one fact per reference
(Robinhood · Fidelity · thinkorswim · Skynet today) per value, plus `overrides` for the combinations
where a reference breaks its own default (Robinhood: trailing stops on stocks only; thinkorswim:
market = DAY only; Skynet: closes are market-only …). `index.html` navigates it: pick a scenario or
take a random one, read the four columns, the Gap (our status + the call-sheet rows), Rendered in
(which of the ten lo-fi journeys carries it) and Confidence (lowest provenance, count of not-shown).
The Coverage panel enumerates every permutation and reports how much the study can actually answer.

**How to open it.** Double-click `index.html` (the model is inlined, no server needed) or serve the
folder (`npx serve docs/design/scenario-navigator`). The URL hash is the scenario, so a card is
linkable. Greybox by convention (`docs/PATTERNS.md` § Lo-fi shapes): system fonts, no brand tokens.

**How a fact gets added.** Edit `scenarios.json` — a dimension value's `facts.<ref>` or a new entry in
`overrides` keyed on the partial combination — with `what` (1–2 sentences), `src` (study ids: `R13`,
`F18`, `T-OS`, `frames 19`, a call-sheet row, or a `file:line` for Skynet) and `prov`
(`frame` · `vendor-quote` · `doc-inferred` · `not-shown`); Skynet facts also carry `status`. Then
refresh the inline copy: `node -e 'const fs=require("fs"),j=JSON.stringify(JSON.parse(fs.readFileSync("scenarios.json","utf8")));fs.writeFileSync("index.html",fs.readFileSync("index.html","utf8").replace(/(id="model">)[\s\S]*?(<\/script>)/,(_,a,b)=>a+j+b))'`
from this folder. Every `src` must resolve to a row in the study — nothing here is invented.

**The rule.** A combination the study cannot answer must say so: write the cell as `not-shown` with
`prov: "not-shown"` and name where the study looked. The Coverage panel counts these; each one is a
research follow-up, never a guess. Journeys are derived from #3407's flow (the issue lists no ten).

Published: https://claude.ai/artifact/96z65tUsjuyhrQgpDbLofZ (private; republish from `index.html` with the document wrapper stripped).
