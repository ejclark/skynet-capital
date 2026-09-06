// One definition of "read the market-event calendar directory" for the dependency-free scripts
// (event-scan.mjs, event-material-scan.mjs) — both run without `npm ci`, neither can import the TS
// loader in src/domain/market-events-data.ts, and the read rule they must agree on grew a second
// clause with issue #1717: canonical `<id>.json` files first, then `proposals/<id>.from-<proposer>.json`
// for ids no canonical file names, first by file name. The drift gate in tests/arch/event-scan.spec.ts
// pins this read to the loader's byte for byte, so the rule lives in exactly two places on purpose:
// here (scripts) and there (runtime), never three.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

function readJsonDir(dir, prefix) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => {
      const file = `${prefix}${f}`;
      try {
        return { file, event: JSON.parse(readFileSync(join(dir, f), "utf8")) };
      } catch (err) {
        throw new Error(`${file} is not valid JSON (${err.message}).`);
      }
    });
}

/** `{ events, files }` — `events` deduped by id (canonical wins, else first proposal by name),
 *  unsorted; `files` every file read, shadowed proposals included, for the validator. Throws on a
 *  missing directory or malformed JSON — loud, never empty (event-scan.mjs's doctrine). */
export function readCalendarDir(dir) {
  if (!existsSync(dir)) throw new Error(`cannot read ${dir} — refusing to guess.`);
  const canonical = readJsonDir(dir, "");
  const proposals = readJsonDir(join(dir, "proposals"), "proposals/");
  const byId = new Map();
  for (const { event } of canonical) byId.set(event?.id, event);
  for (const { event } of proposals) if (!byId.has(event?.id)) byId.set(event?.id, event);
  return { events: [...byId.values()], files: [...canonical, ...proposals] };
}
