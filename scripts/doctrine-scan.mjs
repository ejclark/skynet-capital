#!/usr/bin/env node
// Doctrine scan — the eye behind the bot-trading learning loop (issue #2287, PR 8). Where
// event-scan.mjs asks "is a market-event ledger due for reassessment?", this asks the same
// question of a PERSONA's own doctrine: docs/BOTS-SAURON.md's append-only "Adaptation ledger"
// (one dossier per bot; today only Sauron's exists). Pure decision logic lives in the sibling
// doctrine-decide.mjs, exactly the event-material-scan.mjs / event-material-decide.mjs split.
//
//   node scripts/doctrine-scan.mjs                    # human report: every dossier, due mark
//   node scripts/doctrine-scan.mjs --due              # JSON array of dossiers due for review ([] = no-op)
//   node scripts/doctrine-scan.mjs --candidate        # the first due dossier, as JSON (budget-gate shape)
//   node scripts/doctrine-scan.mjs --update           # rewrite doctrine-budget.json (ratchet: only lower)
//   node scripts/doctrine-scan.mjs --validate         # enforce the contract (exit 1 on violation)
//   node scripts/doctrine-scan.mjs --explain          # decide() from full state on stdin, no fs/network
//   ... --today=YYYY-MM-DD                            # deterministic date override for tests
//   ... --dossiers-dir=                               # fixture override (tests)
//
// Loud-failure doctrine (event-scan.mjs): an unreadable dossier is an error, never an empty
// result — a scheduled caller must not mistake "broken" for "nothing due". An EMPTY dossiers
// directory (no bot has a dossier yet) is the one legitimate "nothing to check" case; a MISSING
// one means the scan is pointed at the wrong place.
//
// Exit codes: 0 ok (--explain: due) · 1 --explain: not due / --validate: a contract violation ·
// 2 could not do its job, verdict UNKNOWN — the dossiers directory does not exist, or --explain got
// no state on stdin (it used to decide on `{}` and answer "due: never-scored").
//
// The budget (doctrine-budget.json) started at 0 — the measured count on 2026-09-22, the day
// docs/BOTS-SAURON.md was created with its first ledger row not yet due — never a fabricated
// number (docs/COACHES.md: grandfather, then shrink).
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { decide, parseLedgerRows, readDossier } from "./doctrine-decide.mjs";

const ROOT = process.cwd();

const arg = (name) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
};
const has = (name) => process.argv.includes(`--${name}`);

const DOSSIERS_DIR = arg("dossiers-dir") ?? join(ROOT, "docs");
const BUDGET_FILE = join(ROOT, "doctrine-budget.json");
const TODAY = arg("today") ?? new Date().toISOString().slice(0, 10);
const DOSSIER_RE = /^BOTS-([A-Z0-9-]+)\.md$/;

/** stdin as text, or `null` when it cannot be read — runExplain() turns both null and "" into an
 *  UNKNOWN (exit 2), because the verdict rests entirely on the state piped in. */
function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return null;
  }
}

/** Every `docs/BOTS-<PERSONA>.md` dossier on disk, as `{ persona, path }` — sorted for determinism.
 *  An EMPTY directory is a legitimate zero-dossier state; a missing one throws (main() checks
 *  first and exits 2), since "no directory" would otherwise read as "nothing due". */
export function findDossiers(dir = DOSSIERS_DIR) {
  return readdirSync(dir)
    .map((f) => f.match(DOSSIER_RE))
    .filter(Boolean)
    .map((m) => ({ persona: m[1].toLowerCase(), path: join(dir, m[0]) }))
    .sort((a, b) => a.persona.localeCompare(b.persona));
}

function runExplain() {
  const raw = readStdin();
  if (!raw?.trim()) {
    console.error(
      "✗ doctrine-scan --explain: no state on stdin — verdict UNKNOWN. Pipe the full state as JSON, " +
        'e.g. {"today":"YYYY-MM-DD","rows":[]}.',
    );
    process.exit(2);
  }
  const input = JSON.parse(raw);
  const decision = decide(input);
  console.log(JSON.stringify(decision, null, 2));
  process.exit(decision.due ? 0 : 1);
}

function assess(dossier) {
  const md = readDossier(dossier.path); // throws loudly if unreadable — never silently skipped
  const rows = parseLedgerRows(md);
  const decision = decide({ today: TODAY, rows });
  return { persona: dossier.persona, ...decision };
}

function main() {
  if (has("explain")) {
    runExplain();
    return 0; // unreachable — runExplain() always exits
  }

  if (!existsSync(DOSSIERS_DIR)) {
    console.error(
      `✗ doctrine-scan: dossiers directory ${DOSSIERS_DIR} does not exist — due state UNKNOWN ` +
        "(an empty directory is the zero-dossier case; a missing one is a wrong path or cwd).",
    );
    return 2;
  }
  const dossiers = findDossiers();
  const assessed = dossiers.map(assess);
  const due = assessed.filter((a) => a.due);

  if (has("due")) {
    console.log(JSON.stringify(due));
    return 0;
  }

  if (has("candidate")) {
    console.log(JSON.stringify(due[0] ?? null));
    return 0;
  }

  if (has("validate")) {
    const problems = dossiers
      .filter((d) => !basename(d.path).startsWith("BOTS-"))
      .map((d) => `${d.path}: dossier file name must be docs/BOTS-<PERSONA>.md`);
    for (const p of problems) console.error(`✗ ${p}`);
    if (problems.length) {
      console.error(`\n${problems.length} contract violation(s).`);
      return 1;
    }
    console.log(`✓ ${dossiers.length} dossier(s) satisfy the contract.`);
    return 0;
  }

  console.log(
    `doctrine-scan: ${dossiers.length} dossier(s), ${due.length} due for review (as of ${TODAY})`,
  );
  for (const a of assessed) {
    const mark = a.due ? `DUE (${a.reason})` : `not due — next check ${a.nextDueDate}`;
    console.log(`  ${a.persona}: ${mark}`);
  }

  if (has("update")) {
    const budget = existsSync(BUDGET_FILE)
      ? JSON.parse(readFileSync(BUDGET_FILE, "utf8"))
      : { dueDossiers: 0 };
    const next = Math.min(budget.dueDossiers, due.length);
    writeFileSync(BUDGET_FILE, `${JSON.stringify({ dueDossiers: next }, null, 2)}\n`);
    console.log(`doctrine-scan: budget ratcheted to ${next}`);
    return 0;
  }

  return 0; // advisory — this scan never fails the build; a due dossier is a digest ride-along
}

if (process.argv[1] && /doctrine-scan\.mjs$/.test(process.argv[1])) process.exit(main());
