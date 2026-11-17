# Forward tests — eurostat-hicp-flash-2026-12-01

| # | Hypothesis | Prediction | Kill switch | Score by | Outcome |
|---|---|---|---|---|---|
| FT-eurostat-hicp-flash-2026-12-01-1 | Eurostat's own "Next release" line plus the ECB statistical release calendar remain a reliable pair for dating a euro-area flash ([`../events/eurostat-hicp-flash-2026-12-01.md`](../events/eurostat-hicp-flash-2026-12-01.md) leg 1); it dated the 10-01 and 11-04 flashes exactly. | The November 2026 euro-area HICP flash publishes on **2026-12-01**. | It publishes on any other date. | 2026-12-02 | _open_ |
| FT-eurostat-hicp-flash-2026-12-01-2 | The November energy base is hard (Nov-2025 energy m/m **+0.9%**) and Brent spot fell about 22% from October's average to November's first eight prints (EIA), so energy y/y falls from October's 20.8% — computable in advance (leg 2). | On **2026-12-01** the flash prints energy **≤ 19.7% y/y** (October flash 20.8%). Central estimate **≈17%**, band 15–19.7%. | Energy y/y **≥ 19.8%**. The crude collapse did not reach the HICP by November, or gas and electricity offset it, and the pass-through model is wrong. | 2026-12-02 | _open_ |
| FT-eurostat-hicp-flash-2026-12-01-3 | The same base arithmetic (Nov-2025 all-items m/m **−0.3%**, services **−0.8%**) plus the energy fall ends the four-month run of rising headlines (Jul 2.9, Aug 3.2, Sep 3.8, Oct 4.0). | On **2026-12-01** the flash headline prints **≤ 3.9%**. Central estimate **≈3.7–3.8%**, band 3.5–3.9%. | Headline **≥ 4.0%**. The run of rising headlines continued despite the oil drop. | 2026-12-02 | _open_ |
| FT-eurostat-hicp-flash-2026-12-01-4 | The energy-hot / core-tame shape that [`../events/ecb-decision-2026-10-29.md`](../events/ecb-decision-2026-10-29.md) rests on survives a fifth month; services passed the 11-04 test at the edge (3.3% against a ≥3.4% kill), so this leg has no margin (leg 3). | On **2026-12-01** core (ex energy, food, alcohol & tobacco) prints **≤ 2.6%** **and** services prints **≤ 3.3%**. Central estimate: core **2.5%**, services **3.3%**. | Core **≥ 2.7%** or services **≥ 3.4%**. Inflation is broadening past energy; the ECB ledger for 12-17 is re-argued there, not here. | 2026-12-02 | _open_ |

**Scoring note.** All four are scored from the **2026-12-01 Eurostat release document itself**, never from
the dissemination API: the API's rate series computes from two-decimal indices and runs up to **0.1pp below**
the published headline, which would mis-score a band written on the press-release convention. The October
figures quoted above are the 11-04 flash's; the 11-18 complete release may revise them by 0.1pp, and the
tests key on November's own printed cell, not on the change. Editing a registered prediction after the fact
is falsification and never happens. No conviction proposal names this event (`scripts/conviction-proposals.mjs`
prints `[]`).
