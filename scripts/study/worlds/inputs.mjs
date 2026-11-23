// Reading a world's input file (#4943 slice 2), with no `src/` import — so the composer can read
// inputs (the EDGAR answers among them) before it loads any server code, which must not load
// until the process clock is pinned.
//
// A world may be layered: `"base": "<world>"` takes that world's input and applies this file's
// overrides — participants by id (fields replaced), `members` wholesale, the bot's own fields (its subscription date), its passes cut
// to those before `passesBefore` with `prependPasses` on top (a bot that stopped earlier), and
// the per-account books a layer may rewrite whole (`humanFills`, `watchlists`, `workingOrders`:
// an account the layer names replaces the base's, the rest are kept). A layer that changes what
// an account holds changes the fills that bought it too, or the ledger and the position disagree.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { msOf } from "./instant.mjs";

const INPUTS = join(import.meta.dirname, "inputs");

/** The account-keyed blocks a layer may rewrite one account at a time. */
const PER_ACCOUNT = ["humanFills", "watchlists", "workingOrders"];

/** A world's input, with a `base` world's input underneath and its overrides applied. */
export function loadInput(name) {
  const raw = JSON.parse(readFileSync(join(INPUTS, `${name}.json`), "utf8"));
  if (!raw.base) return raw;
  const base = loadInput(raw.base);
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
