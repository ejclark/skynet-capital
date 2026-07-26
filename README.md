# Skynet Capital

*An options-trading league — for people first, agents second.*

## The Idea

A friendly, zero-risk paper-trading league. Everyone starts with the **same seed of
$5,000,000 in play money**, trades options however they like, and we compare notes.
No real money on the line to start — just skill, bragging rights, and a reason to talk shop.

Phase two is the fun part: **autonomous AI trading agents**, each with its own personality
and strategy (the news-fader, the retail dreamer, the futurist, the gold bug), competing in
the same league against the humans. We build them, turn them loose on paper accounts, and see
who — or what — comes out ahead.

## Why

Three reasons, all real:

1. **Connection.** A shared thing across generations — from Narayan (20) to Bruce (74) — that's
   genuinely fun to argue about every week.
2. **Skill.** A safe sandbox to learn options mechanics with meaningful-feeling stakes and zero
   downside. Practice the muscle before any real capital is ever involved.
3. **The experiment.** Can a well-designed AI agent out-trade a room of sharp humans? We're going
   to find out with actual data.

## How It Works

- **Platform:** [Alpaca](https://alpaca.markets/) paper-trading accounts — free, fast to set up,
  real market data, fake money.
- **Seed:** $5M paper each. Identical starting line for everyone. *(Amount is a single knob — easy
  to dial up or down before launch.)*
- **Rules:** Loose to start. Trade what you want. We tighten only if the group wants more structure.
- **The ask to join:** Just say "in." Account setup comes later, once we know who's playing.

## Touch Points — Keeping It Alive

The league only works if it stays social. A loose recurring cadence (exact format TBD with the
group — Bruce's idea to bake this in from day one):

- **Weekly-ish check-in** — quick standings, best/worst trade of the week, one thing someone learned.
- **Monthly "shop talk"** — a call or thread to argue strategy, review the agents, and swap reads
  on the market.
- **Season resets** — periodic fresh starts so nobody's ever too far behind to have fun.

The point of the touch points is dialog, not homework. Keep them light, keep them regular.

## Where This Could Go

The near-term focus is dead simple: get people playing on paper. Everything past that — richer
formats, more sophisticated agents, higher stakes — earns its place only once the group is hooked
and the structure has formed organically. We don't get ahead of ourselves.

Start by playing.

## Roadmap

| Phase | What | Status |
|---|---|---|
| 1 | Poll the group, confirm who's in | ▶ In progress |
| 2 | Everyone sets up an Alpaca paper account, same seed | Next |
| 3 | Establish the touch-point cadence | Next |
| 4 | Build the AI agent personas | Later |
| 5 | Autonomous agents trading live on paper accounts | Later |
| 6 | Learning loops + data sources for the agents | Later |

*Phases 4–6 are the long game. Phase 1 is just: do people want to play?*

## For Developers

The agent engine lives alongside this charter. Two opposite personas (the **News Fader** and the
**Futurist**) already run against a paper broker, fully tested — the first vertical slice that
proves the architecture before we scale to more personas.

```sh
npm install
npm test        # Rstest — behavioral specs
npm run lint    # Biome
npm run typecheck
```

- Architecture and engineering standards: [`docs/ENGINEERING.md`](docs/ENGINEERING.md)
- Wiring personas to Alpaca paper accounts: [`docs/BOTS.md`](docs/BOTS.md)
- The shared observatory dashboard: [`docs/DASHBOARD.md`](docs/DASHBOARD.md)
- Autonomous trading: [`docs/AUTONOMOUS.md`](docs/AUTONOMOUS.md)
- Running locally & keeping a laptop awake: [`docs/RUNNING.md`](docs/RUNNING.md)
- Deploying the public live dashboard: [`docs/DEPLOY.md`](docs/DEPLOY.md)
- In-app feedback → GitHub issues (bot token setup): [`docs/FEEDBACK.md`](docs/FEEDBACK.md)
