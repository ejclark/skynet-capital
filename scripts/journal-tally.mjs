#!/usr/bin/env node
// Journal tally: per bot, what its last five sessions placing paper orders proposed, placed and
// explained (#6954 slice 1). Run ON the bots machine by scripts/fitness.mjs's `live-bots-place`
// contract, as `node /app/scripts/journal-tally.mjs /data/audit` over `flyctl machine exec`.
//
// Why it runs there and not in the fitness job: the decision journal is up to 16 MiB per bot before
// it rotates, and a session is ~1,500 records, so five sessions cannot cross `flyctl machine exec`
// as text every tick. This reads the files where they lie and prints a few hundred bytes. It is a
// separate process from the bots, so it still reads the outcome's own trace from outside the
// process that wrote it.
//
// Read-only: it opens journal files for reading and writes only to stdout. It prints counts and
// bot ids and nothing else, because the journal is production data and the clock's logs are public
// (the same rule as parseDecisionLine in fitness.mjs).
//
// A record counts only when the bot was placing paper orders (`mode: "live"`), so a bot the house,
// its owner or its readiness gate holds to watching is not judged here; the fleet health card's
// paper-orders row names that. Days are New York calendar days, since cycles run only in the
// regular session. The newest active file is read first, then its archives newest-first, until a
// sixth live day proves the fifth is whole, or nothing older is left.
import { createReadStream, readdirSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { createGunzip } from "node:zlib";
import { isMain } from "./is-main.mjs";

/** How many sessions placing paper orders a bot is judged over. */
export const TALLY_SESSIONS = 5;

/** The scouts file records under their own ids; a scout is not a bot deciding (fitness.mjs). */
const SCOUTS = new Set(["beta-scout", "cond-scout"]);
const ACTIVE = /^([\w-]+)\.jsonl$/;
// jsonl-rotation.ts: `<stem>.<UTC stamp>.jsonl`, gzipped in place to `.jsonl.gz`.
const ARCHIVE = /^([\w-]+)\.\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.jsonl(\.gz)?$/;

const NEW_YORK_DAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** A count of entries in an array field, or 0 when it is absent or not an array. */
const count = (value, keep = () => true) => (Array.isArray(value) ? value.filter(keep).length : 0);

/**
 * One journal line's contribution, or null when it is not a record of a bot placing paper orders.
 * `explained` is every reason a proposed order was not placed: a guard's refusal, a broker
 * rejection, or a cooldown skip. A halted cycle proposes nothing, so it adds nothing.
 */
export function tallyLine(text) {
  let record;
  try {
    record = JSON.parse(text);
  } catch {
    return null; // a torn line: a crash or a full disk mid-append
  }
  if (record?.mode !== "live" || !Number.isFinite(record.at) || record.at <= 0) return null;
  const outcomes = Array.isArray(record.outcomes) ? record.outcomes : [];
  return {
    day: NEW_YORK_DAY.format(new Date(record.at)),
    proposed: count(record.rawIntents),
    placed: count(outcomes, (o) => o?.action === "placed"),
    explained:
      count(record.refusals) +
      count(outcomes, (o) => o?.action === "rejected" || o?.action === "cooldown-skipped"),
  };
}

/** A bot's files, newest first: the active file, then its archives by stamp, a plain twin dropped. */
export function journalsOf(names, id) {
  const archives = names.filter((n) => ARCHIVE.exec(n)?.[1] === id);
  const present = new Set(archives);
  const kept = archives.filter((n) => !(n.endsWith(".jsonl") && present.has(`${n}.gz`)));
  return [...(names.includes(`${id}.jsonl`) ? [`${id}.jsonl`] : []), ...kept.sort().reverse()];
}

async function addFile(path, days) {
  const raw = createReadStream(path);
  const input = path.endsWith(".gz") ? raw.pipe(createGunzip()) : raw;
  for await (const line of createInterface({ input, crlfDelay: Number.POSITIVE_INFINITY })) {
    const one = tallyLine(line);
    if (!one) continue;
    const day = days.get(one.day) ?? { day: one.day, proposed: 0, placed: 0, explained: 0 };
    day.proposed += one.proposed;
    day.placed += one.placed;
    day.explained += one.explained;
    days.set(one.day, day);
  }
}

/** Every bot's last five live days, newest first. Bots with no live day are left out. */
export async function tallyJournals(dir) {
  const names = readdirSync(dir);
  const ids = names
    .map((n) => ACTIVE.exec(n)?.[1] ?? ARCHIVE.exec(n)?.[1])
    .filter((id) => id && !SCOUTS.has(id));
  const bots = [];
  for (const id of [...new Set(ids)].sort()) {
    const days = new Map();
    for (const file of journalsOf(names, id)) {
      // A sixth day means the fifth is whole: older files hold only older days.
      if (days.size > TALLY_SESSIONS) break;
      await addFile(join(dir, file), days);
    }
    const sessions = [...days.values()]
      .sort((a, b) => b.day.localeCompare(a.day))
      .slice(0, TALLY_SESSIONS);
    if (sessions.length) bots.push({ id, sessions });
  }
  return { tally: 1, bots };
}

if (isMain(import.meta.url)) {
  tallyJournals(process.argv[2] ?? "/data/audit").then(
    (tally) => console.log(JSON.stringify(tally)),
    (error) => {
      // The code and not the message, which can carry a path into a public log.
      console.error(`journal-tally: ${error?.code ?? error?.name ?? "failed"}`);
      process.exit(1);
    },
  );
}
