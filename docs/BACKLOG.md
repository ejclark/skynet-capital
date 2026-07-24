# Backlog

Ideas captured but not yet built. Ordered loosely by when they'll matter.

## Gamify the dashboard

Make the observatory fun to check — turn it from a data readout into a competition.

### Milestones / trophies
- **Total capital across all accounts doubles** (aggregate 2×).
- **First account to double** — a race trophy, awarded once, names the winner.
- (room to grow: first to +50%, biggest single-day gain, longest green streak.)

### Measurements
- **Total capital** across all participants (already the summary strip — build on it).
- **Daily** change: $ and %.
- **Monthly** change: $ and %.
- Per-participant and aggregate, for both.

### Notes for implementation
- Daily/monthly deltas need a **baseline history** — we already persist cycle reports
  (`runtime/*-cycle-report-store`); add periodic equity snapshots per participant so
  deltas are computable without re-deriving from trades.
- Trophies are **derived state**: a pure function over the equity history + seed, same
  testable pattern as the reducer. One place computes "has X account doubled yet".
- Seed baseline per participant (starting equity) must be recorded at onboarding so
  "doubling" has a reference point.
