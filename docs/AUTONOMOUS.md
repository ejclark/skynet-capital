# Autonomous Trading

Bots that assess live market events and act — `buy` / `sell` / `hold` — on their own paper
accounts. Event-driven: the market-data stream pushes price ticks, momentum updates, and the
enabled personas decide. Their fills then propagate to the dashboard exactly like any trade.

## Run it

```sh
set -a && source .env && set +a
npm run run:autonomous
```

Defaults are deliberately conservative for shakeout: **Day Trader only**, **3% per-position
cap**, a **5-minute per-symbol order cooldown**, and trading **only while the market is open**.

Knobs:

| Env | Default | Meaning |
|---|---|---|
| `SKYNET_AUTONOMOUS_BOTS` | `day-trader` | Comma-separated persona ids to enable |
| `SKYNET_MAX_POSITION_PCT` | `0.03` | Max single position as a fraction of equity |
| `SKYNET_MOMENTUM_WINDOW` | `20` | Ticks in the momentum window |
| `SKYNET_SENTIMENT_WINDOW` | `10` | Articles kept in the rolling sentiment window |

Two live signals feed the personas: **momentum** (from the price stream) and **news sentiment**
(from Alpaca news, scored and polled). That means the news-driven personas now act too — enable
them by name, e.g.:

```sh
SKYNET_AUTONOMOUS_BOTS=day-trader,rumor-trader,news-fader npm run run:autonomous
```

Run it alongside `npm run serve:dashboard` (same machine or the deployed server) and watch the
orders land on the dashboard live.

## How it works

```
market-data stream ──price──▶ MomentumTracker ──context──▶ AutonomousTrader.evaluate()
                                                              │ persona.decide → risk guards
                                                              │ per-symbol cooldown filter
                                                              ▼ broker.submit (Alpaca paper)
                                                            fill ──▶ trade_updates ──▶ dashboard
```

- `autonomous/momentum-tracker.ts` — rolling price windows → `MarketContext` (quotes + momentum).
- `autonomous/autonomous-trader.ts` — decide → guard → **cooldown** → submit. The cooldown is
  the safety valve: without it a persona that stays bullish would re-fire the same buy on every
  tick before the first fill lands.
- `src/scripts/run-autonomous.ts` — wires the stream to the tracker and throttled evaluation,
  gated on market hours.

Everything above the broker is unit-tested with fakes (no network, no keys).

## Safety notes

- **Paper only.** These are paper accounts; still, treat the shakeout carefully — start with one
  bot and a small cap, widen once the loop behaves.
- **Momentum is tick-based** in this first slice (simple and legible), not time-bar-based. Good
  enough to prove the loop; a bar-based signal is a natural refinement.
- **News sentiment** is scored with a simple lexical scorer (`news/sentiment-scorer.ts`) — legible
  and dependency-free, and swappable for an LLM scorer later since personas only consume the number.
- News is **polled** (~60s) rather than streamed in this slice; Alpaca's news websocket is the
  natural event-driven refinement.
