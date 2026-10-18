import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { unscoredForwardTests } from "../../scripts/forward-test-pending.mjs";
import { printEventId, UPCOMING_PRINTS } from "../domain/earnings-calendar.js";
import { marketDayKey } from "../domain/market-day.js";
import { allEvents } from "../domain/market-events.js";
import type { MarketEvent } from "../domain/market-events-types.js";
import type { Conviction } from "../playbooks/conviction-record.js";
import { CONVICTIONS } from "../playbooks/conviction-store.js";
import { isStale, type Pair, pairName, pairTable } from "../playbooks/pair-table.js";
import { RESEARCH_DIR, type ResearchDoc, symbolResearch } from "./research-service.js";

/**
 * THE SYMBOL DOSSIER (2026-10-18 audit) — everything the house already knows about one ticker,
 * joined at read time, for an agent to read BEFORE it researches or trades the name.
 *
 * Why data, not a per-symbol agent. Eric asked whether CRWV deserved its own agent team. The audit
 * found every CRWV failure was a lookup failure, not a missing skill: one forward test was filed
 * twice (legacy FT-15 and the conviction's proposal), the filing-session mismatch was "found" three
 * times, and the two places that hard-coded CRWV facts into instructions had both gone stale. A
 * per-symbol agent would be a third such place. So the specificity lives here, assembled fresh on
 * every read from the files that own each fact — nothing is copied, so nothing here can drift, and
 * no lane gains a shared file to fight over.
 *
 * Every line names the file it came from. PURE over the repo's checked-in files: no network, no
 * clock (the caller passes `asOfIso`), no writes. Paper only; it sizes nothing.
 */

export interface DossierPair {
  readonly id: string;
  readonly name: string;
  readonly evidence: Pair["evidence"];
  readonly stale: boolean;
}

export interface DossierForwardTest {
  readonly event: string;
  readonly id: string;
  readonly scoreBy: string;
  /** The score-by date has arrived and the row is still unscored. */
  readonly overdue: boolean;
}

export interface SymbolDossier {
  readonly symbol: string;
  readonly asOf: string;
  readonly events: readonly MarketEvent[];
  readonly pairs: readonly DossierPair[];
  readonly convictions: readonly Conviction[];
  readonly forwardTests: readonly DossierForwardTest[];
  /** The first line of each kill-list entry that names the symbol. */
  readonly killed: readonly string[];
  readonly ledgers: readonly ResearchDoc[];
  readonly studies: readonly ResearchDoc[];
  /** The nearest event ledger's `## At a glance` section, as written — the current stance. */
  readonly glance?: { readonly from: string; readonly md: string };
}

const KILL_LIST = "multi-symbol-sweep.md";
const KILL_CHARS = 240;
const LEGACY = "legacy";
const KILL_HEADING = "## Kill list";

/** The kill list's entries (`- **…**` bullets until the next `## `) that name the symbol. */
function killedFor(symbol: string, root: string): string[] {
  const file = join(root, KILL_LIST);
  if (!existsSync(file)) return [];
  const md = readFileSync(file, "utf8");
  const at = md.indexOf(KILL_HEADING);
  if (at === -1) return [];
  const rest = md.slice(at + KILL_HEADING.length);
  const end = rest.search(/^##\s/m);
  const section = end === -1 ? rest : rest.slice(0, end);
  const named = new RegExp(`\\b${symbol}\\b`);
  return section
    .split(/\n(?=- \*\*)/)
    .filter((entry) => entry.startsWith("- **") && named.test(entry))
    .map((entry) => {
      const flat = entry.replace(/\s+/g, " ").trim();
      return flat.length > KILL_CHARS ? `${flat.slice(0, KILL_CHARS)}…` : flat;
    });
}

/**
 * Legacy bare-number rows (`forward-tests/legacy.md`) that name the symbol and are still unscored.
 * No lane owns them and no scanner reads them (`docs/process/EVENT-RESEARCH.md`), which is how one
 * CRWV test came to be registered twice (legacy FT-15, then the AI-dip conviction's proposal).
 */
function legacyFor(symbol: string, ftDir: string, today: string): DossierForwardTest[] {
  const file = join(ftDir, `${LEGACY}.md`);
  if (!existsSync(file)) return [];
  const named = new RegExp(`\\b${symbol}\\b`);
  const naming = new Set(
    readFileSync(file, "utf8")
      .split("\n")
      .filter((line) => /^\|\s*FT-/.test(line) && named.test(line))
      .map((line) => line.match(/^\|\s*(FT-\S+)/)?.[1]),
  );
  return unscoredForwardTests(LEGACY, ftDir)
    .filter((r) => naming.has(r.id))
    .map((r) => ({ event: LEGACY, ...r, overdue: r.scoreBy <= today }));
}

function glanceOf(slug: string, root: string): SymbolDossier["glance"] {
  const file = join(root, `${slug}.md`);
  if (!existsSync(file)) return undefined;
  const md = readFileSync(file, "utf8");
  const at = md.indexOf("## At a glance");
  if (at === -1) return undefined;
  const rest = md.slice(at + "## At a glance".length);
  const end = rest.search(/^##\s/m);
  const body = (end === -1 ? rest : rest.slice(0, end)).trim();
  return body ? { from: `docs/research/${slug}.md`, md: body } : undefined;
}

/** Assemble the dossier. Undefined when the house knows nothing about the symbol at all. */
export function symbolDossier(
  symbol: string,
  asOfIso: string,
  root: string = RESEARCH_DIR(),
): SymbolDossier | undefined {
  const sym = symbol.toUpperCase();
  const today = marketDayKey(asOfIso);
  const research = symbolResearch(sym, asOfIso, root, allEvents(asOfIso));
  const pairs = pairTable()
    .filter((p) => p.symbols.includes(sym))
    .map((p) => ({
      id: p.id,
      name: pairName(p),
      evidence: p.evidence,
      stale: isStale(p.evidence, asOfIso),
    }));
  const convictions = CONVICTIONS.all().filter((c) =>
    c.steers.some((id) => pairs.some((p) => p.id === id)),
  );
  const ledgers = research?.ledgers ?? [];
  const ftDir = join(root, "forward-tests");
  const eventIds = new Set([
    ...ledgers.map((d) => d.slug.replace(/^events\//, "")),
    ...UPCOMING_PRINTS.filter((p) => p.symbol === sym).map(printEventId),
  ]);
  const forwardTests = existsSync(ftDir)
    ? [
        ...[...eventIds].flatMap((event) =>
          unscoredForwardTests(event, ftDir).map((r) => ({
            event,
            ...r,
            overdue: r.scoreBy <= today,
          })),
        ),
        ...legacyFor(sym, ftDir, today),
      ]
    : [];
  const killed = killedFor(sym, root);
  const events = research?.events ?? [];
  const studies = research?.studies ?? [];
  if (!(events.length || pairs.length || ledgers.length || studies.length || killed.length)) {
    return undefined;
  }
  const nearest = events.find((e) => ledgers.some((d) => d.slug === `events/${e.id}`));
  const glance = nearest ? glanceOf(`events/${nearest.id}`, root) : undefined;
  return {
    symbol: sym,
    asOf: today,
    events,
    pairs,
    convictions,
    forwardTests: forwardTests.sort((a, b) => a.scoreBy.localeCompare(b.scoreBy)),
    killed,
    ledgers,
    studies,
    ...(glance ? { glance } : {}),
  };
}

const MAX_EVENTS = 8;
const MAX_LEDGERS = 10;

const eventLine = (e: MarketEvent): string =>
  `- ${e.date} · ${e.title} · ${e.status} · ${e.impact} · \`${e.id}\``;

function pairLines(p: DossierPair): string[] {
  const e = p.evidence;
  const facts = [
    e.status + (e.qualifier ? ` (${e.qualifier})` : ""),
    e.confidence ? `confidence ${e.confidence}` : undefined,
    e.verdictOn ? `verdict ${e.verdictOn}` : undefined,
    e.shelfOn ? `re-research by ${e.shelfOn}${p.stale ? " — PAST DUE" : ""}` : undefined,
    e.checkOn ? `check ${e.checkOn}` : undefined,
  ].filter(Boolean);
  return [
    `- **${p.id}** (${p.name}) · ${facts.join(" · ")}`,
    `  - call: ${e.call}`,
    ...(e.number ? [`  - number: ${e.number}`] : []),
    ...(e.study ? [`  - study: \`${e.study}\``] : []),
  ];
}

function convictionLines(c: Conviction): string[] {
  const head = `- **${c.title ?? c.id}** — ${c.owner}, stated ${c.statedOn}, checked ${c.checkOn}${
    c.acceptsAssignment ? ", assignment accepted" : ""
  } · steers ${c.steers.join(", ")} · \`${c.source ?? "src/playbooks/conviction-seeds.ts"}\``;
  return [
    head,
    ...c.claims.map((claim) => {
      const score = claim.score ? `${claim.score.outcome}` : claim.bucket;
      const by = claim.scoreBy ? ` (score by ${claim.scoreBy})` : "";
      return `  - ${claim.statement} — **${score}**${by}. Wrong if: ${claim.falsifier}`;
    }),
  ];
}

/** The dossier as markdown an agent reads first. Fixed section order, so a change reads at a glance. */
export function renderDossier(d: SymbolDossier): string {
  const section = (title: string, lines: readonly string[], empty: string) => [
    `## ${title}`,
    "",
    ...(lines.length ? lines : [`_${empty}_`]),
    "",
  ];
  const overdue = d.forwardTests.filter((t) => t.overdue).length;
  return [
    `# ${d.symbol} — what the house already knows (assembled ${d.asOf})`,
    "",
    "_Read this before researching or trading the name. Assembled at read time from the files that own each fact (`npm run research:dossier -- " +
      d.symbol +
      "`); nothing here is new research, and every line names its source. Paper only._",
    "",
    ...section(
      "The current stance",
      d.glance ? [`From \`${d.glance.from}\`:`, "", d.glance.md] : [],
      "No ledger for the next dated event carries an At a glance section.",
    ),
    ...section(
      `Next dated events (${d.events.length})`,
      d.events.slice(0, MAX_EVENTS).map(eventLine),
      "Nothing on the calendar names this symbol.",
    ),
    ...section(
      "The bots' pairs on this symbol (`src/playbooks/pair-table.ts`)",
      d.pairs.flatMap(pairLines),
      "No bot pair trades this symbol.",
    ),
    ...section(
      "Convictions steering those pairs",
      d.convictions.flatMap(convictionLines),
      "No conviction record steers a pair on this symbol.",
    ),
    ...section(
      `Open forward tests naming this symbol (${d.forwardTests.length}, ${overdue} overdue)`,
      d.forwardTests.map(
        (t) =>
          `- \`${t.id}\` · score by ${t.scoreBy}${t.overdue ? " · **OVERDUE**" : ""} · \`docs/research/forward-tests/${t.event}.md\``,
      ),
      "None open — check before registering one; a duplicate is the most common re-work.",
    ),
    ...section(
      "Killed — never re-propose without new prints (`docs/research/multi-symbol-sweep.md`)",
      d.killed.map((k) => `- ${k.replace(/^- /, "")}`),
      "No kill-list entry names this symbol.",
    ),
    ...section(
      `Event ledgers, newest event first (${d.ledgers.length})`,
      [
        ...d.ledgers
          .slice(0, MAX_LEDGERS)
          .map(
            (l) =>
              `- \`docs/research/${l.slug}.md\` · ${l.title}${l.lastAssessed ? ` · ${l.lastAssessed}` : ""}`,
          ),
        ...(d.ledgers.length > MAX_LEDGERS
          ? [`- …and ${d.ledgers.length - MAX_LEDGERS} older`]
          : []),
      ],
      "No event ledger is keyed to this symbol.",
    ),
    ...section(
      `Studies that name it (${d.studies.length})`,
      d.studies.map((s) => `- \`docs/research/${s.slug}.md\` · ${s.title}`),
      "No study names this symbol.",
    ),
  ].join("\n");
}
