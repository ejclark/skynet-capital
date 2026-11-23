// Reading a world's input file (#4943 slice 2), with no `src/` import — so the composer can read
// inputs (the EDGAR answers among them) before it loads any server code, which must not load
// until the process clock is pinned.
//
// A world may be layered: `"base": "<world>"` takes that world's input and applies this file's
// overrides — participants by id (fields replaced), `members` and `controls` wholesale, and the
// bot's passes cut to those before `passesBefore` with `prependPasses` on top (a bot that stopped
// earlier). A base that names `bots` takes the same per bot, keyed by id under `bots`
// (`{ "<id>": { passesBefore, prependPasses, subscribed } }`); `subscribed` replaces that bot's list.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { msOf } from "./instant.mjs";

const INPUTS = join(import.meta.dirname, "inputs");

/** One bot with a layer's overrides: passes cut and prepended, its subscriptions replaced. */
function layerBot(bot, over = {}) {
  const passes = over.passesBefore
    ? bot.passes.filter((p) => msOf(p.at) < msOf(over.passesBefore))
    : bot.passes;
  return {
    ...bot,
    ...(over.subscribed ? { subscribed: over.subscribed } : {}),
    passes: [...(over.prependPasses ?? []), ...passes],
  };
}

/** A world's input, with a `base` world's input underneath and its overrides applied. */
export function loadInput(name) {
  const raw = JSON.parse(readFileSync(join(INPUTS, `${name}.json`), "utf8"));
  if (!raw.base) return raw;
  const base = loadInput(raw.base);
  const participants = base.participants.map((p) => ({
    ...p,
    ...(raw.participants?.[p.id] ?? {}),
  }));
  return {
    ...base,
    ...(raw.members ? { members: raw.members } : {}),
    ...(raw.controls ? { controls: raw.controls } : {}),
    ...(raw.wired ? { wired: raw.wired } : {}),
    participants,
    ...(base.bots
      ? { bots: base.bots.map((b) => layerBot(b, raw.bots?.[b.id])) }
      : { bot: layerBot(base.bot, raw.bot) }),
  };
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
