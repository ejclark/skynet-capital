# Forward tests — eurostat-hicp-flash-2026-11-04

| # | Hypothesis | Prediction | Kill switch | Score by | Outcome |
|---|---|---|---|---|---|
| FT-eurostat-hicp-flash-2026-11-04-1 | Eurostat's own "next flash" sentence plus the ECB statistical release calendar remain a reliable pair for dating a euro-area flash ([`../events/eurostat-hicp-flash-2026-11-04.md`](../events/eurostat-hicp-flash-2026-11-04.md) leg 1). | The October 2026 euro-area HICP flash publishes on **2026-11-04**. | It publishes on any other date. | 2026-11-05 | _open_ |
| FT-eurostat-hicp-flash-2026-11-04-2 | The October energy base is soft (Oct-2025 energy m/m **−0.2%**) and crude kept rising, so energy and the headline accelerate a fourth time — computable in advance, not just narratable after (leg 2). | On **2026-11-04** the flash prints headline **≥ 3.9%** (from 3.8%) **and** energy **≥ 19.5% y/y** (from 18.9%). Central estimate: headline **≈3.9–4.0%**, energy **≈21%**. | Headline **≤ 3.8%**, or energy y/y **≤ 19.4%**. Either kills the base-effect arithmetic, or says crude's October average did not exceed September's. | 2026-11-05 | _open_ |
| FT-eurostat-hicp-flash-2026-11-04-3 | The energy-hot / core-tame shape that [`../events/ecb-decision-2026-10-29.md`](../events/ecb-decision-2026-10-29.md) rests on survives a second month of the supply shock (leg 3). | On **2026-11-04** core (ex energy, food, alcohol & tobacco) prints **≤ 2.6%** **and** services prints **≤ 3.3%**. Central estimate: core **2.5%**, services **3.2%**. | Core **≥ 2.7%** or services **≥ 3.4%**. The shape has broken and the ECB and FOMC ledgers are re-argued there, not here. | 2026-11-05 | _open_ |

**Scoring note.** All three are scored from the **2026-11-04 Eurostat release document itself**, never
from the dissemination API: the API's rate series computes from two-decimal indices and runs up to
**0.1pp below** the published headline, which would mis-score a band written on the press-release
convention. Editing a registered prediction after the fact is falsification and never happens.
