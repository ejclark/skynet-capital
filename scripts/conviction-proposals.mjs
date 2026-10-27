// Conviction proposals — the hand-off from a conviction's "Forward tests to register" table to the
// event lane that owns each row's fragment (#5482 criterion 2: a claim with no study "SHALL offer
// to register a forward test").
//
// WHY THIS EXISTS. A forward-test row may be written only by the lane that owns
// `docs/research/events/<event-id>.md` (docs/research/forward-tests.md → "Where the rows live"), so
// a conviction doc can only PROPOSE rows. Until this file, nothing told the owning lane a proposal
// existed: AI-dip's six rows (proposed 2026-10-16) were still unregistered on 2026-10-27, after
// several pulses of both events, and quiet pulses are closed by the deterministic screen without a
// session at all. Now the screen (event-material-scan.mjs) reads the proposals for the event it is
// probing, and an UNANSWERED one is material: the pulse gets a session, which registers or declines
// it (docs/process/EVENT-RESEARCH.md → "Conviction proposals").
//
// THE TOKEN. Each proposal row carries an Id (`P1`, `P2`…); its token is `<conviction-slug>/<Id>`,
// e.g. `ai-dip-2026-10/P3`. A proposal is ANSWERED once that token appears anywhere in the event's
// own fragment (registered: the row cites it) or its ledger (declined: a row says why). Both files
// are the owning lane's, so the one-writer rule holds, and either answer ends the escalation — the
// screen can never loop on a proposal the lane has seen. A proposal whose score-by date has passed
// is dropped (registering it late would score nothing honestly). A row with no Id is a citation
// (e.g. "already registered as FT-…"), never a proposal.
//
//   node scripts/conviction-proposals.mjs [--today=YYYY-MM-DD]   → pending proposals, all events
//   node scripts/conviction-proposals.mjs --event=<id> [--today]  → pending for one event

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
export const CONVICTIONS_DIR = join(ROOT, "docs", "research", "convictions");
const FRAGMENT_DIR = join(ROOT, "docs", "research", "forward-tests");
const LEDGER_DIR = join(ROOT, "docs", "research", "events");

const SECTION = /^##\s+Forward tests to register\s*$/im;
const cells = (line) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
const unwrap = (cell) => cell.replace(/^`+|`+$/g, "").trim();

/** Every proposal row in one conviction doc. Pure. The table is the first one under
 *  `## Forward tests to register`; columns are found by header name, so their order can change. */
export function parseProposals(slug, text) {
  const at = text.search(SECTION);
  if (at === -1) return [];
  const lines = text.slice(at).split("\n").slice(1);
  const start = lines.findIndex((l) => l.trim().startsWith("|"));
  if (start === -1) return [];
  const table = [];
  for (const line of lines.slice(start)) {
    if (!line.trim().startsWith("|")) break;
    table.push(cells(line));
  }
  const [header, , ...rows] = table;
  const col = (name) => header.findIndex((h) => h.toLowerCase() === name);
  const [iId, iFrag, iScore, iHyp] = ["id", "fragment", "score by", "hypothesis"].map(col);
  if (iId === -1 || iFrag === -1) return [];
  return rows
    .map((r) => ({ id: unwrap(r[iId] ?? ""), row: r }))
    .filter(({ id }) => /^P\d+$/.test(id))
    .map(({ id, row }) => ({
      key: `${slug}/${id}`,
      fragment: unwrap(row[iFrag] ?? ""),
      scoreBy: iScore === -1 ? "" : unwrap(row[iScore] ?? ""),
      hypothesis: iHyp === -1 ? "" : (row[iHyp] ?? ""),
    }));
}

/** The proposals for `eventId` still waiting on its lane. Pure: `answeredText` is the event's
 *  fragment plus its ledger, concatenated; a token anywhere in it is an answer — a whole token,
 *  so `…/P1` is not answered by `…/P10`. */
export function pendingFor(eventId, today, proposals, answeredText) {
  const answered = (key) =>
    new RegExp(`${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?!\\d)`).test(answeredText);
  return proposals.filter(
    (p) =>
      p.fragment === eventId &&
      !(/^\d{4}-\d{2}-\d{2}$/.test(p.scoreBy) && p.scoreBy < today) &&
      !answered(p.key),
  );
}

/** Every proposal in every conviction doc. A missing directory is no proposals, not an error. */
export function loadProposals(dir = CONVICTIONS_DIR) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .sort()
    .flatMap((f) => parseProposals(f.replace(/\.md$/, ""), readFileSync(join(dir, f), "utf8")));
}

/** The fragment and ledger text for one event — what counts as the lane's answer. */
export function answeredTextFor(
  eventId,
  { fragmentDir = FRAGMENT_DIR, ledgerDir = LEDGER_DIR } = {},
) {
  return [join(fragmentDir, `${eventId}.md`), join(ledgerDir, `${eventId}.md`)]
    .filter((p) => existsSync(p))
    .map((p) => readFileSync(p, "utf8"))
    .join("\n");
}

function main() {
  const arg = (name) => {
    const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
    return hit ? hit.slice(name.length + 3) : undefined;
  };
  const today = arg("today") ?? new Date().toISOString().slice(0, 10);
  const proposals = loadProposals();
  const only = arg("event");
  const events = only ? [only] : [...new Set(proposals.map((p) => p.fragment))].sort();
  const pending = events.flatMap((id) =>
    pendingFor(id, today, proposals, answeredTextFor(id)).map((p) => ({ event: id, ...p })),
  );
  console.log(JSON.stringify(pending, null, 2));
}

if (process.argv[1]?.endsWith("conviction-proposals.mjs")) main();
