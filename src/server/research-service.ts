/**
 * The research shelf's data layer — `docs/research/` served to authed members as a living
 * research surface (docs/plans/research-lab.md, slice 1; sharpened 2026-08-17 by Eric's
 * direction: symbol-first pages + calendar↔research links).
 *
 * GIT STAYS THE CMS (the plan's standing constraint): studies and event ledgers are markdown in
 * the repo — versioned, reviewed in diffs, deployed like everything else. This module only READS
 * them. Content is repo-trusted (it enters through reviewed PRs, the same trust doctrine as the
 * checked-in domain tables), so markdown renders unsanitized; the invite gate upstream bounds
 * the audience. What is NOT trusted is the URL: slugs are resolved by membership in the actual
 * directory listing — never path-joined — so traversal is structurally impossible, not filtered.
 *
 * Doc-internal links (`../multi-symbol-sweep.md`, `events/<id>.md`) are rewritten to their
 * `/research/...` routes at render time, so the shelf reads as a connected surface, not a repo
 * mirror. The `**Last assessed:**` line is the same machine contract scripts/event-scan.mjs
 * reads — one contract, two consumers, zero drift.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { marked } from "marked";
import { UPCOMING_PRINTS } from "../domain/earnings-calendar.js";
import { allEvents, type MarketEvent } from "../domain/market-events.js";
import { escapeHtml } from "../ui/escape-html.js";
import { DECISION_HEADINGS, type EventCall, todayCallOf } from "./research-event-calls.js";

// Re-exported so existing importers of the call-sheet contract keep working unchanged. (An
// `export ... from` re-export trips Biome's noBarrelFile even in a file full of real logic, so
// this imports the binding above and re-exports it here instead.)
export type { EventCall };
export { todayCallOf };

// GFM on, but strikethrough OFF: research prose uses `~` for "approximately" everywhere (never
// strikethrough), and GFM's single-tilde pairing silently strikes the span between two of them
// (e.g. "~$91.8B … ~7%"). Disabling the `del` tokenizer makes every `~` render literally.
marked.use({ gfm: true, tokenizer: { del: () => undefined } });

export interface ResearchDoc {
  /** URL slug under /research — "multi-symbol-sweep" or "events/nvda-2026-08-26-print". */
  readonly slug: string;
  /** First `# ` heading, or the filename when a doc has none. */
  readonly title: string;
  /** The scanner's machine-contract line, when the doc carries one (ledgers do). */
  readonly lastAssessed: string | null;
}

export interface ResearchShelf {
  readonly studies: readonly ResearchDoc[];
  readonly ledgers: readonly ResearchDoc[];
}

export interface SymbolResearch {
  readonly symbol: string;
  /** Upcoming calendar events carrying this symbol (already date-sorted by allEvents). */
  readonly events: readonly MarketEvent[];
  /** This symbol's event ledgers, newest event first. */
  readonly ledgers: readonly ResearchDoc[];
  /** Studies whose text mentions the symbol (word-boundary match). */
  readonly studies: readonly ResearchDoc[];
  /** Verbatim "Stance & kill switches" excerpt from the nearest upcoming ledger, rendered. */
  readonly stance: { readonly html: string; readonly from: ResearchDoc } | null;
}

const RESEARCH_DIR = (): string => join(process.cwd(), "docs", "research");
const SKIP = new Set(["TEMPLATE.md", "README.md"]);

const titleOf = (md: string, fallback: string): string =>
  md.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? fallback;

const lastAssessedOf = (md: string): string | null =>
  md.match(/^\*\*Last assessed:\*\*\s*(\S+)/m)?.[1] ?? null;

function docsIn(dir: string, slugPrefix: string): ResearchDoc[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md") && !SKIP.has(f))
    .map((f) => {
      const md = readFileSync(join(dir, f), "utf8");
      const name = f.replace(/\.md$/, "");
      return {
        slug: `${slugPrefix}${name}`,
        title: titleOf(md, name),
        lastAssessed: lastAssessedOf(md),
      };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

/** Everything on the shelf. `root` is injectable for specs; defaults to the real docs tree. */
export function listResearch(root: string = RESEARCH_DIR()): ResearchShelf {
  return {
    studies: docsIn(root, ""),
    ledgers: docsIn(join(root, "events"), "events/"),
  };
}

/** Ledger event-ids that have research — the calendar's link set. */
export function researchedEventIds(root: string = RESEARCH_DIR()): ReadonlySet<string> {
  return new Set(listResearch(root).ledgers.map((d) => d.slug.slice("events/".length)));
}

/** Rewrite doc-internal `*.md` hrefs to their live /research routes; external links untouched. */
function rewriteDocLinks(html: string): string {
  return html.replace(/href="([^"]+\.md)(#[^"]*)?"/g, (whole, target: string, hash?: string) => {
    if (/^[a-z]+:\/\//.test(target)) return whole; // absolute URLs pass through
    const flat = target.replace(/^(\.\.\/)+/, "").replace(/^\.\//, "");
    const slug =
      flat.startsWith("events/") || !flat.includes("/") ? flat.replace(/\.md$/, "") : null;
    return slug ? `href="/research/${slug}${hash ?? ""}"` : whole;
  });
}

export interface RenderedDoc extends ResearchDoc {
  readonly html: string;
  /**
   * The rendered `## At a glance` decision header, when the doc carries one — a faithful
   * surfacing of the body's stance (TL;DR + horizon table + signal conditions), authored in the
   * doc, never inferred from prose. Null when the doc has no such section.
   */
  readonly glanceHtml: string | null;
}

/**
 * Split the authored `## At a glance` decision block out of the body so the view can promote it
 * to a styled header. Returns the section markdown (or null) and the body with it removed — the
 * block is authored content, not a generated summary, so this only relocates, never rewrites.
 */
function extractGlance(md: string): { glanceMd: string | null; bodyMd: string } {
  for (const marker of DECISION_HEADINGS) {
    const at = md.indexOf(marker);
    if (at === -1) continue;
    // The heading may carry a trailing clause ("## The call — what to do, by name"), so cut at the
    // end of the heading LINE rather than at the end of the marker.
    const lineEnd = md.indexOf("\n", at);
    const rest = lineEnd === -1 ? "" : md.slice(lineEnd + 1);
    const nextRel = rest.search(/^##\s/m);
    const glanceMd = (nextRel === -1 ? rest : rest.slice(0, nextRel)).trim();
    if (!glanceMd) continue;
    const after = nextRel === -1 ? "" : rest.slice(nextRel);
    return { glanceMd, bodyMd: `${md.slice(0, at)}${after}`.trim() };
  }
  return { glanceMd: null, bodyMd: md };
}

/**
 * Sections that stay EXPANDED. Everything else in a research document folds.
 *
 * The rule is Eric's (2026-08-25): a ledger should open on what it concluded, not on how it was
 * worked out. The decision header is already promoted above the article, and the stance is the
 * live position — those are the two things a reader is here for. `Initial research` (8,000–10,000
 * chars of method), the append-only `Assessment ledger` (single table cells running past 2,000
 * chars), and the closed-out `Outcome` are all receipts: present, one click away, never the wall
 * you land on.
 *
 * This costs the machine audience NOTHING — the docs/ISSUES.md synthesis, applied here: a fold
 * collapses for humans while staying fully present in the raw markdown the next assessment session
 * reads. There is no trade-off to manage.
 */
const OPEN_SECTIONS = ["stance & kill switches", "the picture", "the headline"];

/** Rough word count — the honest size label on a fold, so nothing is hidden silently. */
function wordCount(md: string): number {
  return md.split(/\s+/).filter(Boolean).length;
}

/**
 * Split a document body into its `## ` sections, fence-aware so a heading-shaped line inside a
 * code block is never mistaken for a real heading. Returns the preamble (anything before the first
 * heading) plus one entry per section.
 */
function splitSections(md: string): {
  preamble: string;
  sections: { heading: string; body: string }[];
} {
  const lines = md.split("\n");
  const sections: { heading: string; body: string }[] = [];
  const preamble: string[] = [];
  let current: { heading: string; body: string[] } | null = null;
  let fenced = false;
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    const heading = !fenced && /^##\s+(.+)$/.exec(line);
    if (heading) {
      if (current) sections.push({ heading: current.heading, body: current.body.join("\n") });
      current = { heading: (heading[1] ?? "").trim(), body: [] };
    } else if (current) {
      current.body.push(line);
    } else {
      preamble.push(line);
    }
  }
  if (current) sections.push({ heading: current.heading, body: current.body.join("\n") });
  return { preamble: preamble.join("\n"), sections };
}

/**
 * Fold a document's sections for reading: render each one, leaving OPEN_SECTIONS expanded and
 * wrapping the rest in `<details>` whose summary names the section AND its size.
 *
 * RELOCATES, NEVER REWRITES — the same honesty doctrine extractGlance follows. Not one word of a
 * document changes; only its default disclosure does. Safe to parse per-section because no
 * document in the corpus uses reference-style link definitions, the one hazard of splitting before
 * marked.parse.
 */
function renderFolded(md: string): string {
  const { preamble, sections } = splitSections(md);
  const head = preamble.trim() ? (marked.parse(preamble) as string) : "";
  const body = sections
    .map(({ heading, body }) => {
      const inner = marked.parse(`## ${heading}\n${body}`) as string;
      if (OPEN_SECTIONS.includes(heading.toLowerCase())) return inner;
      const words = wordCount(body);
      const size =
        words > 0 ? ` <span class="rs-foldsize">~${words.toLocaleString()} words</span>` : "";
      return `<details class="rs-fold">
        <summary><span class="rs-foldname">${escapeHtml(heading)}</span>${size}</summary>
        ${marked.parse(body) as string}
      </details>`;
    })
    .join("\n");
  return `${head}${body}`;
}

/**
 * Event id → the call its ledger reached, for every ledger that states one. Built the same way
 * researchedEventIds builds the link set, so the agenda gets both from one directory read.
 */
export function eventCalls(root: string = RESEARCH_DIR()): ReadonlyMap<string, EventCall> {
  const calls = new Map<string, EventCall>();
  for (const doc of listResearch(root).ledgers) {
    const found = todayCallOf(readFileSync(join(root, `${doc.slug}.md`), "utf8"));
    if (found) calls.set(doc.slug.slice("events/".length), found);
  }
  return calls;
}

/**
 * Resolve a requested slug by MEMBERSHIP in the shelf listing (the anti-traversal doctrine) and
 * render it. Unknown slug → null → the route 404s.
 */
export function findResearchDoc(slug: string, root: string = RESEARCH_DIR()): RenderedDoc | null {
  const shelf = listResearch(root);
  const doc = [...shelf.studies, ...shelf.ledgers].find((d) => d.slug === slug);
  if (!doc) return null;
  const file = join(root, `${doc.slug}.md`);
  const { glanceMd, bodyMd } = extractGlance(readFileSync(file, "utf8"));
  return {
    ...doc,
    html: rewriteDocLinks(renderFolded(bodyMd)),
    glanceHtml: glanceMd ? rewriteDocLinks(marked.parse(glanceMd) as string) : null,
  };
}

/** Verbatim section extraction — an excerpt, never a summary (honesty: no lossy compression). */
function sectionOf(md: string, heading: string): string | null {
  const at = md.indexOf(`## ${heading}`);
  if (at === -1) return null;
  const rest = md.slice(at + heading.length + 3);
  const next = rest.search(/^##\s/m);
  return rest.slice(0, next === -1 ? undefined : next).trim() || null;
}

/**
 * Symbol cards for the shelf: every symbol with a ledger, plus its next upcoming event.
 * Symbols come from the domain tables; a symbol earns a card once research exists for it.
 */
export function shelfSymbols(
  asOfIso: string,
  root: string = RESEARCH_DIR(),
  upcoming: readonly MarketEvent[] = allEvents(asOfIso),
): { readonly symbol: string; readonly next?: MarketEvent }[] {
  const syms = new Set<string>();
  for (const e of upcoming) for (const s of e.symbols) syms.add(s);
  for (const p of UPCOMING_PRINTS) syms.add(p.symbol);
  const ledgers = listResearch(root).ledgers;
  return [...syms]
    .filter((s) => ledgers.some((d) => ledgerIsFor(d, s)))
    .sort()
    .map((symbol) => {
      const next = upcoming.find((e) => e.symbols.includes(symbol));
      return next ? { symbol, next } : { symbol };
    });
}

/** Ledger ids are `<sym>-<date>-print` for prints; match by lowercase prefix. */
const ledgerIsFor = (doc: ResearchDoc, symbol: string): boolean =>
  doc.slug.startsWith(`events/${symbol.toLowerCase()}-`);

/**
 * The living symbol page's data: everything symbol-keyed the repo already holds, assembled —
 * no new facts, no summarization, just the join the app never surfaced.
 */
export function symbolResearch(
  symbol: string,
  asOfIso: string,
  root: string = RESEARCH_DIR(),
  upcoming: readonly MarketEvent[] = allEvents(asOfIso),
): SymbolResearch | null {
  const sym = symbol.toUpperCase();
  if (!/^[A-Z]{1,6}$/.test(sym)) return null;
  const shelf = listResearch(root);
  const events = upcoming.filter((e) => e.symbols.includes(sym));
  const ledgers = shelf.ledgers.filter((d) => ledgerIsFor(d, sym)).reverse();
  const mention = new RegExp(`\\b${sym}\\b`);
  const studies = shelf.studies.filter((d) =>
    mention.test(readFileSync(join(root, `${d.slug}.md`), "utf8")),
  );
  if (events.length === 0 && ledgers.length === 0 && studies.length === 0) return null;

  const nearest = events.find((e) => ledgers.some((d) => d.slug === `events/${e.id}`));
  const nearestDoc = nearest ? ledgers.find((d) => d.slug === `events/${nearest.id}`) : undefined;
  let stance: SymbolResearch["stance"] = null;
  if (nearestDoc) {
    const md = readFileSync(join(root, `${nearestDoc.slug}.md`), "utf8");
    const section = sectionOf(md, "Stance & kill switches");
    if (section) {
      stance = { html: rewriteDocLinks(marked.parse(section) as string), from: nearestDoc };
    }
  }
  return { symbol: sym, events, ledgers, studies, stance };
}
