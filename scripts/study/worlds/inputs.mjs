// Reading a world's input file (#4943 slice 2), with no `src/` import — so the composer can read
// inputs (the EDGAR answers among them) before it loads any server code, which must not load
// until the process clock is pinned.
//
// A world may be layered: `"base": "<world>"` takes that world's input and applies this file's
// overrides — participants by id (fields replaced), `members` wholesale, the bot's own fields (its
// subscription date), its passes cut to those before `passesBefore` with `prependPasses` on top (a
// bot that stopped earlier), and the per-account books a layer may rewrite whole (`humanFills`,
// `watchlists`, `workingOrders`: an account the layer names replaces the base's, the rest are
// kept). A layer that changes what an account holds changes the fills that bought it too, or the
// ledger and the position disagree.
//
// A layer may also MOVE the base world in time (#8005): `"instant"` names its own (instant.mjs),
// `"corpus"` its own tree facts, `"vix"` the last VIX close its quests read, `"market"` symbols added to the base's, and `"shiftDays"` (whole weeks only) moves every calendar fact of
// the base — an expiry, a listed sale window, a filing date, the date inside an OCC symbol — by
// that many days, so a book designed around one Thursday holds together on another. Its time
// tokens are relative to the instant already and move by themselves; a whole number of weeks keeps
// every weekday, session and fill hour. A date the shift lands on a market holiday moves to the
// session before it, as an expiry does (OCC); the closures are market-calendar.ts's, pure data.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isMarketClosed } from "../../../src/domain/market-calendar.ts";
import { msOf } from "./instant.mjs";

const INPUTS = join(import.meta.dirname, "inputs");

/** The account-keyed blocks a layer may rewrite one account at a time. */
const PER_ACCOUNT = ["humanFills", "watchlists", "workingOrders"];
const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const OCC = /^([A-Z]{1,6})(\d{2})(\d{2})(\d{2})([CP]\d{8})$/;

/** `YYYY-MM-DD` moved by `days`, then back to the session before it if the market is shut. */
export function shiftDay(date, days) {
  const at = new Date(`${date}T00:00:00Z`);
  at.setUTCDate(at.getUTCDate() + days);
  let out = at.toISOString().slice(0, 10);
  while (isMarketClosed(out)) {
    at.setUTCDate(at.getUTCDate() - 1);
    out = at.toISOString().slice(0, 10);
  }
  return out;
}

/** Every calendar fact in a JSON-shaped value moved by `days` (a whole number of weeks): plain
 *  `YYYY-MM-DD` strings and the expiry inside OCC symbols. Keys, tokens and prose are untouched. */
export function shiftCalendar(value, days) {
  if (!(Number.isInteger(days) && days % 7 === 0)) {
    throw new Error(`inputs: shiftDays must be whole weeks (got ${days})`);
  }
  if (Array.isArray(value)) return value.map((v) => shiftCalendar(v, days));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shiftCalendar(v, days)]));
  }
  if (typeof value !== "string") return value;
  if (DAY.test(value)) return shiftDay(value, days);
  const occ = OCC.exec(value);
  if (!occ) return value;
  const moved = shiftDay(`20${occ[2]}-${occ[3]}-${occ[4]}`, days).replace(/-/g, "").slice(2);
  return `${occ[1]}${moved}${occ[5]}`;
}

/** A world's input, with a `base` world's input underneath and its overrides applied. */
export function loadInput(name) {
  const raw = JSON.parse(readFileSync(join(INPUTS, `${name}.json`), "utf8"));
  if (!raw.base) return raw;
  const under = loadInput(raw.base);
  const base = raw.shiftDays ? shiftCalendar(under, raw.shiftDays) : under;
  const participants = base.participants.map((p) => ({
    ...p,
    ...(raw.participants?.[p.id] ?? {}),
  }));
  const passes = raw.bot?.passesBefore
    ? base.bot.passes.filter((p) => msOf(p.at) < msOf(raw.bot.passesBefore))
    : base.bot.passes;
  const byAccount = Object.fromEntries(
    PER_ACCOUNT.filter((k) => raw[k] || base[k]).map((k) => [k, { ...base[k], ...raw[k] }]),
  );
  return {
    ...base,
    ...(raw.instant ? { instant: raw.instant } : {}),
    ...(raw.corpus ? { corpus: raw.corpus } : {}),
    ...(raw.vix ? { vix: raw.vix } : {}),
    ...(raw.market
      ? {
          market: {
            ...base.market,
            ...raw.market,
            symbols: { ...base.market?.symbols, ...raw.market.symbols },
          },
        }
      : {}),
    ...(raw.members ? { members: raw.members } : {}),
    ...byAccount,
    participants,
    bot: {
      ...base.bot,
      ...botFields(raw.bot),
      passes: [...(raw.bot?.prependPasses ?? []), ...passes],
    },
  };
}

/** A layer's own bot fields (its subscription date, say) — everything but the pass controls. */
function botFields(bot = {}) {
  const { passesBefore: _before, prependPasses: _prepend, ...fields } = bot;
  return fields;
}

/** Cboe's VIX history, which the quests read for its last close (src/server/vix-feed.ts), answered
 *  from the input's `vix` block (one session's close, cited) as the CSV Cboe serves. */
export function vixAnswer(input) {
  const vix = input.vix;
  return (url) => {
    if (!vix || url !== "https://cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv") {
      return undefined;
    }
    const [y, m, d] = vix.session.split("-");
    const c = Number(vix.close).toFixed(2);
    return {
      raw: `DATE,OPEN,HIGH,LOW,CLOSE\n${m}/${d}/${y},${c},${c},${c},${c}\n`,
      contentType: "text/csv",
    };
  };
}

/** Everything off the machine a world's inputs answer: EDGAR, then the VIX history. */
export function worldNetwork(input) {
  const edgar = edgarAnswer(input);
  const vix = vixAnswer(input);
  return (url) => edgar(url) ?? vix(url);
}

/** SEC EDGAR's two documents the guidance route reads, answered from the input's `edgar` block. */
export function edgarAnswer(input) {
  const companies = input.edgar ?? {};
  return (url) => {
    if (url === "https://www.sec.gov/files/company_tickers.json") {
      return Object.fromEntries(
        Object.entries(companies).map(([ticker, c], i) => [String(i), { cik_str: c.cik, ticker }]),
      );
    }
    const cik = /submissions\/CIK(\d+)\.json$/.exec(url)?.[1];
    const company = Object.values(companies).find((c) => cik && Number(cik) === c.cik);
    if (!company) return undefined;
    return {
      filings: {
        recent: {
          form: company.eightKs.map(() => "8-K"),
          filingDate: company.eightKs.map((f) => f.date),
          items: company.eightKs.map((f) => f.items),
        },
      },
    };
  };
}
