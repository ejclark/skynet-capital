# Forward tests — nvda-2026-11-18-print

<!-- One event's pre-registered hypotheses, written ONLY by the lane that owns
     docs/research/events/nvda-2026-11-18-print.md — never by a sibling lane, which is what lets
     every research PR merge without touching a shared file (issue #1449). The register at
     ../forward-tests.md is composed from these files; never add a row there. Ids are
     FT-nvda-2026-11-18-print-<n>, <n> counting up within this file. Rows append only; the
     Outcome column is the one cell the close-out fills. -->

| # | Hypothesis | Prediction | Kill switch | Score by | Outcome |
|---|---|---|---|---|---|
| FT-nvda-2026-11-18-print-1 | **The Q3 call notice names Tue 11-17 or Wed 11-18** — registered 2026-10-05 at D-44, the print date being an `estimate`; cadence: Q3 lags of 23/24/24 days after a quarter end of 2026-10-25 (inferred), notice 21 days ahead last year | NVIDIA's IR call notice is posted by 2026-10-30 and names 2026-11-17 or 2026-11-18 | Any other date (incl. 11-19, 11-25, December), or no notice on nvidianews.nvidia.com by 2026-11-06 | 2026-11-06 | _open_ |
| FT-nvda-2026-11-18-print-2 | **The reaction-day fade survives the August print** — registered 2026-10-05; modern era 4 green of 15 reaction days (open D+1 → close D+1 mean −2.16%), the August one +2.30% | Open D+1 → close D+1 on this print is negative, scored from re-run instrument data on whichever day NVIDIA actually reports | Zero or positive: two straight green reaction days retire the fade (S3 stays shelved, "don't buy the pop" is dropped to no-view) | 2026-11-30 | _open_ |
| FT-nvda-2026-11-18-print-3 | **The 16th pre-print run-up** — registered 2026-10-05; 15 of 15 modern-era 20-day windows positive (mean +9.16%, P=0.0032 vs a 68% base); NVDA-specific (AMD 53%, AVGO 47%, MRVL 67% over the same windows) | Close D-20 → close D is positive on this print | Negative: the run-up regime ends on its first miss, and S1 loses its premise | 2026-11-30 | _open_ |
| FT-nvda-2026-11-18-print-4 | **Realized move vs the ~7% implied** — registered 2026-10-05; aggregator-quoted ~7% implied (low quality, undated) against ~5.4% average realized over two years; the August print realized 8.74% close-to-close against ~7.0% (scored by that event's FT-8, not here) | \|close D → close D+1\| on this print is below 7.0% | At or above 7.0%: a second straight realized-over-implied print, so the short-premium tilt loses its support | 2026-11-30 | _open_ |
