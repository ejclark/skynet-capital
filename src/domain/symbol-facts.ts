/**
 * FACTS ABOUT A STOCK THAT NO STRATEGY OWNS (#4807 slice 1) — one checked-in JSON file per symbol,
 * `src/domain/symbols/<SYM>.json`, assembled here at load.
 *
 * Why its own file. A fact like "CRWV's print reaction lands the session after the filing" is true
 * for every strategy, but it was written down only inside the wheel's fit study
 * (`docs/research/crwv-premium-fit.md` call 3), so every other reader had to work it out again or
 * go without. Here it is data the symbol summary (`src/research/symbol-outlook.ts`) reads, and that
 * a playbook's fit research cites instead of re-deriving. One file per symbol for the same reason
 * the event calendar is one file per event (#1449): two lanes amending two names never touch the
 * same path.
 *
 * What does NOT belong here: a strategy's own timing (the run-up's "out at D-5" stays a strategy
 * setting), a call, or anything dated — those are research, and research lives in the ledgers.
 * Every fact cites its source and the observation that would prove it wrong.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

/** A fact with its receipt: where it was found and what would overturn it. */
interface CitedFact {
  readonly fact: string;
  /** The study or ledger that established it (`docs/research/… → call N`). */
  readonly source: string;
  readonly falsifier: string;
}

export interface SymbolFacts {
  readonly symbol: string;
  /**
   * Where a print's price reaction lands. `sessionsAfter` counts sessions past the print's last
   * possible date that still belong to its protected window. It can only WIDEN the house default
   * (one session, `optionPrintBlackout`): an estimate may only widen a safety window, and so may a
   * fact.
   */
  readonly printReaction?: CitedFact & { readonly sessionsAfter: number };
}

/** Where the per-symbol files live, relative to the repo root. */
export const SYMBOL_FACTS_DIR = join("src", "domain", "symbols");

const TICKER = /^[A-Z]{1,6}$/;
const filled = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

/** The boot-time shape guard: loud on the first malformed file, naming it. */
function parseFacts(raw: unknown, file: string): SymbolFacts {
  const fail = (what: string): never => {
    throw new Error(`symbol-facts: ${file}: ${what}`);
  };
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) fail("not a JSON object");
  const f = raw as Record<string, unknown>;
  if (!(filled(f.symbol) && TICKER.test(f.symbol))) fail("symbol must be an upper-case ticker");
  if (`${f.symbol}.json` !== file) fail(`symbol "${f.symbol}" does not match the file name`);
  const reaction = f.printReaction as Record<string, unknown> | undefined;
  if (reaction !== undefined) {
    const n = reaction.sessionsAfter;
    if (!(Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 5))
      fail("printReaction.sessionsAfter must be a whole number from 1 to 5");
    for (const key of ["fact", "source", "falsifier"] as const)
      if (!filled(reaction[key])) fail(`printReaction.${key} is required`);
  }
  return raw as SymbolFacts;
}

/** Every `<SYM>.json` under `dir`, keyed by symbol. Exported so specs can point it at a fixture. */
export function loadSymbolFacts(
  dir: string = join(process.cwd(), SYMBOL_FACTS_DIR),
): ReadonlyMap<string, SymbolFacts> {
  if (!existsSync(dir)) return new Map();
  return new Map(
    readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .map((f) => {
        const facts = parseFacts(JSON.parse(readFileSync(join(dir, f), "utf8")), f);
        return [basename(f, ".json"), facts] as const;
      }),
  );
}

export const SYMBOL_FACTS: ReadonlyMap<string, SymbolFacts> = loadSymbolFacts();
