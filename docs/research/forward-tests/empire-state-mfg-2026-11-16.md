# Forward tests — empire-state-mfg-2026-11-16

<!-- One event's pre-registered hypotheses, written ONLY by the lane that owns
     docs/research/events/empire-state-mfg-2026-11-16.md — never by a sibling lane, which is what lets
     every research PR merge without touching a shared file (issue #1449). The register at
     ../forward-tests.md is composed from these files; never add a row there. Ids are
     FT-empire-state-mfg-2026-11-16-<n>, <n> counting up within this file. Rows append only; the
     Outcome column is the one cell the close-out fills. -->

| # | Hypothesis | Prediction | Kill switch | Score by | Outcome |
|---|---|---|---|---|---|
| FT-empire-state-mfg-2026-11-16-1 | **Prices paid is persistent enough to forecast** — registered **2026-11-05 at D-11** of the `confirmed` [empire-state-mfg-2026-11-16](../events/empire-state-mfg-2026-11-16.md). Fit on the NY Fed's own seasonally-adjusted CSV (304 months, to 2026-10): lag-1 ρ 0.931, October 59.5, one-step central 57.7, resid sd 7.60. Model-free: after a print of 55 or more, the next was at or above 50 in 32 of 38 months. | The November 2026 Empire State prices-paid index (seasonally adjusted, NY Fed overview page or `esms_seasonallyadjusted_diffusion.csv`) prints **at or above 50.0**; registered probability **84%** (full-sample AR(1) 84.5%, base rate 84.2%). | A November prices-paid print **below 50.0** — the eighth-straight-print streak ends and the persistence leg is re-fit before the 12-15 edition. | 2026-11-17 | _open_ |
| FT-empire-state-mfg-2026-11-16-2 | **The headline mean-reverts from a 91st-percentile print** — registered **2026-11-05 at D-11**. October's 25.5 followed a +17.9 move (92nd percentile of 303 monthly changes). Headline lag-1 ρ 0.718 full-sample, 0.357 since 2024: central 20.3 (10.2). Model-free: after a headline at or above 20, the next print was below 25.5 in 37 of 57 months. | The November 2026 Empire State general-business-conditions index prints **below 25.5** (October, as currently published); registered probability **69%** (full-sample AR(1) 68.6%, base rate 64.9%). A weaker claim than any point forecast, by design. | A November headline **at or above 25.5**. One observation; it does not re-litigate the autocorrelation fit. | 2026-11-17 | _open_ |
