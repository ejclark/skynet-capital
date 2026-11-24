// Fetch the sector closes an edition's whole-market overview needs, and write them into the edition
// (#7077 slice 1b). The overview draws all 11 GICS sectors and the S&P 500, one fund each, over
// Day · Week · Month · YTD; `src/domain/edition-sectors.ts` names the funds, fixes each period's
// starting date from the calendar, and works the moves out of these closes on every request.
//
// The edition writer (`npm run edition:write`, #8252) fills the same block itself through the same
// fetch (`src/research/yahoo-closes.ts`); this stays for a hand-written edition or a re-fetch.
// Yahoo daily closes, split-adjusted, with dividends not added back: a move is a price change,
// which is what the page says.
//
// Usage: npm run edition:sectors -- <YYYY-MM-DD>   (an edition file must already exist for that date)
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { neededCloses, SECTOR_FUNDS } from "../src/domain/edition-sectors.ts";
import { sectorCloses } from "../src/research/yahoo-closes.ts";
import { reexecWithProxy } from "./proxy-reexec.mjs";

// Node's fetch ignores HTTPS_PROXY; behind an agent proxy every request would fail (proxy-reexec.mjs).
reexecWithProxy();

const date = process.argv[2] ?? "";
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  process.stderr.write("usage: npm run edition:sectors -- <YYYY-MM-DD>\n");
  process.exit(2);
}
const file = join(process.cwd(), "src", "domain", "editions", `${date}.json`);
// Each period's starting close and the 20 sessions the range band (AT8, slice 1c) is drawn from.
const needed = neededCloses(date);

const edition = JSON.parse(readFileSync(file, "utf8"));
edition.sectors = await sectorCloses(date, new Date().toISOString().slice(0, 10));
writeFileSync(file, `${JSON.stringify(edition, null, 2)}\n`);
process.stdout.write(
  `${file}: ${SECTOR_FUNDS.length} funds, ${needed.length} closes each, ${needed[0]} to ${date}. Run biome format on it.\n`,
);
