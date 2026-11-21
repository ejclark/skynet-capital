// The FACULTY WORLD — the offline paper account a simulated faculty (member actors + experts)
// tries to CHANGE through the UI, and the one boot whose writes land (docs/members/change-scenarios.md).
//
// The journeys' frozen world answers "can a member reach this screen?"; nothing in it can answer
// "did the order the member meant to place actually land?", because offline writes were no-ops
// and OPEN mode refuses trading ("Trading is switched off for this deployment" — trading is on
// only when sign-in is configured, src/server/account-identity-gate.ts). This world is the
// session boot (crawl@example.test owns Eric's account) plus:
//
//  - SKYNET_OFFLINE_WRITES=apply — orders, cancels, replaces and closes land in an in-memory paper
//    account (src/adapters/writable-fixture-trading-transport.ts) and read back through the same
//    client the desk uses;
//  - a SIMULATED market (src/adapters/synthetic-market-transport.ts) priced from `marks.json`
//    below — quotes, chains, contracts — so an option scenario has a chain to pick from;
//  - Eric's book enriched so every common change has something to act on: shares to sell
//    (EEM 950), a round lot for a covered call (AAPL 100), a long call to take profit on
//    (NVDA Dec 180, his 2026-10-18 scenario), a working limit order to change or cancel
//    (BUY 10 MSFT @ $400 GTC), and cash to sell a cash-secured put (CRWV, his scenario 1).
//
// Clock: the wall clock and the real session (src/runtime/data-source.ts → marketClock): after
// hours an order queues for the open and fills on the first read once it opens, as a paper
// account's would. Scenarios therefore never name a date, and their `end` accepts
// ["working","filled"]. Pin a run with SKYNET_FIXED_NOW and the market and the broker both follow.
//
//   node scripts/faculty/world.mjs            # prints the fixtures dir it wrote
//   import { facultyFixturesDir, facultyBootEnv } from "./world.mjs"

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { frozenFixturesDir } from "../crawl/frozen-fixtures.mjs";
import { offlineBootEnv } from "../crawl/server.mjs";

/** One price per underlying — the simulated market's whole state. */
export const FACULTY_MARKS = {
  AAPL: 230,
  MSFT: 420,
  NVDA: 180,
  CRWV: 80,
  SPY: 590,
  EEM: 43.5,
  XLE: 90,
  XLF: 39,
  TSLA: 330,
  QQQ: 510,
};

/** The NVDA call Eric holds — the long call with no exit plan from his 2026-10-18 scenario. */
export const FACULTY_NVDA_CALL = "NVDA261218C00180000";

/** The working order every order-management scenario starts from. */
export const FACULTY_WORKING_ORDER = {
  id: "faculty-msft-limit",
  client_order_id: "faculty-msft-limit-client",
  symbol: "MSFT",
  qty: "10",
  side: "buy",
  type: "limit",
  time_in_force: "gtc",
  limit_price: "400",
  stop_price: null,
  status: "new",
  filled_qty: "0",
  filled_avg_price: null,
  submitted_at: "2026-11-13T15:30:00Z",
  filled_at: null,
  canceled_at: null,
  order_class: "simple",
  asset_class: "us_equity",
};

/** Eric's faculty book: cash for a CSP, a round lot, a long call, and the working order above. */
function facultyEric(eric) {
  return {
    ...eric,
    account: {
      ...eric.account,
      cash: "40000.00",
      portfolio_value: "106125.00",
      options_trading_level: 3,
      options_buying_power: "40000.00",
    },
    positions: [
      {
        symbol: "EEM",
        qty: "950",
        avg_entry_price: "42.20",
        market_value: "41325.00",
        side: "long",
        asset_class: "us_equity",
      },
      {
        symbol: "AAPL",
        qty: "100",
        avg_entry_price: "205.00",
        market_value: "23000.00",
        side: "long",
        asset_class: "us_equity",
      },
      {
        symbol: FACULTY_NVDA_CALL,
        qty: "2",
        avg_entry_price: "6.40",
        market_value: "1800.00",
        side: "long",
        asset_class: "us_option",
      },
    ],
    orders: [
      ...(eric.orders ?? []),
      {
        id: "faculty-aapl-buy",
        symbol: "AAPL",
        qty: "100",
        side: "buy",
        type: "market",
        status: "filled",
        filled_qty: "100",
        filled_avg_price: "205.00",
        submitted_at: "2026-09-02T14:31:00Z",
        filled_at: "2026-09-02T14:31:01Z",
      },
      {
        id: "faculty-nvda-call-buy",
        symbol: FACULTY_NVDA_CALL,
        qty: "2",
        side: "buy",
        type: "limit",
        limit_price: "6.40",
        status: "filled",
        filled_qty: "2",
        filled_avg_price: "6.40",
        submitted_at: "2026-10-01T15:02:00Z",
        filled_at: "2026-10-01T15:02:04Z",
        position_intent: "buy_to_open",
      },
      FACULTY_WORKING_ORDER,
    ],
  };
}

/** A fresh fixtures dir: the journeys' frozen roster with Eric's faculty book and the marks. */
export function facultyFixturesDir() {
  const dir = frozenFixturesDir();
  const path = join(dir, "participants.json");
  const roster = JSON.parse(readFileSync(path, "utf8"));
  writeFileSync(
    path,
    JSON.stringify(roster.map((p) => (p.id === "human-eric" ? facultyEric(p) : p))),
  );
  writeFileSync(join(dir, "marks.json"), JSON.stringify(FACULTY_MARKS));
  return dir;
}

/** The env a faculty boot runs with — the session journey boot with writes on. */
export function facultyBootEnv({ port, bridgePort, fixtures }) {
  return {
    ...offlineBootEnv({ mode: "session", port, bridgePort, fixtures }),
    SKYNET_OFFLINE_WRITES: "apply",
  };
}

if (process.argv[1]?.endsWith("world.mjs")) {
  process.stdout.write(`${facultyFixturesDir()}\n`);
}
