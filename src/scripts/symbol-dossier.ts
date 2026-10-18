/**
 * CLI: print the symbol dossier — what the house already knows about a ticker (2026-10-18 audit).
 *
 *   npm run research:dossier -- CRWV            # markdown, for an agent to read first
 *   npm run research:dossier -- CRWV NVDA       # several, one after another
 *   npm run research:dossier -- CRWV --json     # the structured form
 *
 * Read-only and offline: it joins checked-in files (`src/server/symbol-dossier.ts`). Exit 1 when a
 * symbol is unknown to the house, so a lane that asked for one can tell "nothing known" from a read.
 */
import { renderDossier, symbolDossier } from "../server/symbol-dossier.js";

const args = process.argv.slice(2);
const json = args.includes("--json");
const symbols = args.filter((a) => !a.startsWith("--"));
if (symbols.length === 0) {
  console.error("usage: npm run research:dossier -- <SYMBOL> [<SYMBOL> …] [--json]");
  process.exit(2);
}
const now = new Date().toISOString();
let unknown = 0;
for (const symbol of symbols) {
  const dossier = symbolDossier(symbol, now);
  if (!dossier) {
    console.error(`research:dossier: the house knows nothing about ${symbol.toUpperCase()} yet.`);
    unknown++;
    continue;
  }
  console.log(json ? JSON.stringify(dossier, null, 2) : renderDossier(dossier));
}
process.exit(unknown > 0 ? 1 : 0);
