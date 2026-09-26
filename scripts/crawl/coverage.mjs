#!/usr/bin/env node
// The journey coverage table — every living screen, and which member journey steps visit it at
// phone width. Eric asked for "a comprehensive list of user journeys" to drive the mobile-first
// audit and ruled that a dead screen gets no phone work (2026-09-26), so "comprehensive" is a
// number, not an adjective: every living page·section is visited by ≥1 phone journey step, or it
// carries a triage verdict that says nobody needs it (`retire` / `redirect-only`, never a gap).
//
//   npm run crawl:coverage                 # writes docs/members/coverage.md, prints the headline + gaps
//   npm run crawl:coverage -- --json       # the joined rows as JSON on stdout, writes nothing
//   npm run crawl:coverage -- --out /tmp/c.md
//
// THREE INPUTS, JOINED. (1) The screens, read from the code so a new one cannot be missed: the
// SPA's route paths (`app/src/routeTree.gen.ts`, `/u/$id` and `/u/$id/` are one screen), each
// route's `{ id: "x", label: "Y" }` section literals (its own file plus any file it imports that
// declares a `PageSection<…>[] = [` list — that is how `/accounts` and `/settings` get theirs),
// the Milestones `?chapter=` values, and the server's own pages, hand-listed below with the line
// that proves each still exists. (2) The verdicts, `docs/members/triage.json` — hand-maintained,
// seeded from the route triage of 2026-09-26. (3) The journeys, `e2e/journeys/*.journey.json`
// through `steps.mjs`, the one reading of the schema. A step visits the screen its `goto` LANDS
// on: the route's default section when the URL names none (a member with no account opens
// `/accounts` on Milestones with the Onboarding chapter), and a redirect-only row is followed to
// its target. Trade's sections count only from phone steps — at desktop they dock onto one bench
// and `?section=` only scrolls (`app/src/routes/trade.tsx`, THE BENCH), so a desktop visit proves
// nothing about one section.
//
// Loud-failure doctrine: a file that declares a section list and yields zero parsed sections, a
// hand-listed server page whose line is gone, or a malformed triage row throws. A screen the code
// has and triage does not (unjudged), or a living triage row no screen matches (stale), is written
// into the report AND exits 1 — a new screen cannot slip in unjudged.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { posix } from "node:path";

import { routeLabel } from "./maps.mjs";
import { loadJourneys, stepRunsAt, viewportsFor } from "./steps.mjs";

const ROUTE_TREE = "app/src/routeTree.gen.ts";
const TRIAGE = "docs/members/triage.json";
const OUT = "docs/members/coverage.md";

const VERDICTS = new Set(["keep", "fold", "retire", "redirect-only", "undecided"]);
/** Never a gap: nobody needs these at phone width (Eric: dead screens get no phone work). */
const NOT_LIVING = new Set(["retire", "redirect-only"]);

/** `?chapter=` belongs to one section of one route (`shell/profile-sections.ts`'s chapterFromSearch).
 *  `door` is the chapter a member with no account gets when the URL names none — the zero-account
 *  door (`routes/accounts.tsx`: `search.chapter ?? (!linked && section === "milestones" …)`). */
const CHAPTERS = {
  path: "/accounts",
  section: "milestones",
  door: "onboarding",
  file: "app/src/shell/milestone-card.tsx",
  name: "MILESTONE_CHAPTERS",
};

/** A route whose default is not its first section — `profile-sections.ts`'s `defaultSection`. */
const DEFAULTS = {
  "/accounts": (linked) => (linked ? "overview" : "milestones"),
};

/** Routes whose sections dock at desktop, so only a phone step shows one section alone. */
const DOCKED = new Set(["/trade"]);

/** The server's own pages — not in the SPA's route tree, so listed by hand; each names the line
 *  that serves it, checked on every run so a removed page cannot linger here. */
const SERVER_PAGES = [
  {
    screen: "server /login",
    file: "src/server/dashboard-auth-gate.ts",
    needle: 'path === "/login"',
  },
  {
    screen: "server /welcome",
    file: "src/server/dashboard-board-routes.ts",
    needle: 'path === "/welcome"',
  },
  {
    screen: "server /tower",
    file: "src/server/dashboard-board-routes.ts",
    needle: 'path === "/tower"',
  },
  {
    screen: "server /research/<slug>",
    file: "src/server/research-page-routes.ts",
    needle: 'path.startsWith("/research/")',
  },
  {
    screen: "server /feedback/preview",
    file: "src/server/dashboard-server.ts",
    needle: 'path === "/feedback/preview"',
  },
  {
    screen: "server /board/frame",
    file: "src/server/dashboard-server.ts",
    needle: 'path === "/board/frame"',
  },
  { screen: "unknown URL" },
];

// ── parsers (pure — the spec drives them over fixture strings) ─────────────────────────────────

/**
 * The SPA's screens from the generated route tree: `[{ path, modules }]`, `modules` the
 * `routes/<file>` specifiers (no extension) that render it. A trailing slash is the same screen.
 */
export function parseRouteTree(src) {
  const moduleOf = new Map();
  for (const m of src.matchAll(/import \{ Route as (\w+) \} from '\.\/(routes\/[^']+)'/g)) {
    moduleOf.set(m[1], m[2]);
  }
  const byPath = new Map();
  for (const m of src.matchAll(/fullPath: '([^']+)'\s+preLoaderRoute: typeof (\w+)/g)) {
    const path = m[1].replace(/(.)\/$/, "$1");
    const mod = moduleOf.get(m[2]);
    if (!mod)
      throw new Error(`coverage: route ${m[1]} imports ${m[2]}, which the tree never names`);
    byPath.set(path, [...(byPath.get(path) ?? []), mod]);
  }
  if (byPath.size === 0) throw new Error("coverage: no fullPath parsed from the route tree");
  return [...byPath]
    .map(([path, modules]) => ({ path, modules }))
    .sort((a, b) => (a.path < b.path ? -1 : 1));
}

/** Does this source declare a section list (`PageSection<X>[] = [`), not merely type a prop? */
export function declaresSections(src) {
  return /PageSection<[^>]*>\[\]\s*=\s*\[/.test(src);
}

/** Every `{ id: "x", label: "Y" }` literal in a source, deduped by id — a spread list is a union. */
export function parseSections(src) {
  const out = new Map();
  for (const m of src.matchAll(/\{\s*id:\s*"([^"]+)",\s*label:\s*"([^"]+)"\s*,?\s*\}/g)) {
    if (!out.has(m[1])) out.set(m[1], { id: m[1], label: m[2] });
  }
  return [...out.values()];
}

/** The string members of `const <name>… = [ "a", "b" ]`. */
export function parseChapters(src, name) {
  const body = src.match(new RegExp(`${name}[^=]*=\\s*\\[([^\\]]*)\\]`))?.[1];
  const ids = body ? [...body.matchAll(/"([^"]+)"/g)].map((m) => m[1]) : [];
  if (ids.length === 0) throw new Error(`coverage: no ${name} values parsed`);
  return ids;
}

/**
 * A route's sections: its own file's literals, plus every relatively-imported file that declares
 * a section list. `read(path)` returns the text or undefined. Throws when a declaring file yields
 * none — a section list the regex cannot read would otherwise vanish from the table silently.
 */
export function sectionsOf(file, read) {
  const src = read(file);
  if (src === undefined) throw new Error(`coverage: cannot read ${file}`);
  const files = declaresSections(src) ? [file] : [];
  for (const m of src.matchAll(/from "(\.\.?\/[^"]+)"/g)) {
    const base = posix.join(posix.dirname(file), m[1]);
    const hit = [".ts", ".tsx"].map((ext) => base + ext).find((p) => read(p) !== undefined);
    if (hit && declaresSections(read(hit))) files.push(hit);
  }
  // Only a file that declares a section list contributes — an `{ id, label }` literal elsewhere
  // (a lens picker's options) is not a section of the page.
  const union = new Map();
  for (const f of files) {
    const found = parseSections(read(f));
    if (found.length === 0) {
      throw new Error(
        `coverage: ${f} declares PageSection<…>[] but no { id, label } literal parsed`,
      );
    }
    for (const s of found) if (!union.has(s.id)) union.set(s.id, s);
  }
  return [...union.values()];
}

/** A triage screen's join key: the label with its trailing "(…)" note dropped. */
export function screenKey(screen) {
  return screen.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

const keyFor = (path, section, chapter) =>
  section === undefined
    ? path
    : `${path} ?section=${section}${chapter === undefined ? "" : `&chapter=${chapter}`}`;

/**
 * Every screen the code has: `[{ key, path, section?, chapter? }]`. A route with sections is its
 * sections (never the bare path); Milestones also gets one row per chapter.
 */
export function buildScreens({ routes, sections, chapters, serverPages }) {
  const out = [];
  for (const { path } of routes) {
    const list = sections.get(path) ?? [];
    if (list.length === 0) out.push({ key: path, path });
    for (const s of list) {
      out.push({ key: keyFor(path, s.id), path, section: s.id });
      if (path === CHAPTERS.path && s.id === CHAPTERS.section) {
        for (const c of chapters)
          out.push({ key: keyFor(path, s.id, c), path, section: s.id, chapter: c });
      }
    }
  }
  for (const p of serverPages) out.push({ key: screenKey(p.screen), path: null });
  return out;
}

/** The route pattern a concrete path belongs to (`/u/sauron/thesis` → `/u/$id/thesis`). */
export function matchRoute(pathname, routePaths) {
  if (routePaths.includes(pathname)) return pathname;
  return routePaths.find((p) =>
    new RegExp(`^${p.replace(/\$\w+/g, "[^/]+").replace(/\//g, "\\/")}$`).test(pathname),
  );
}

/**
 * The screen keys a `goto` lands on, for a member who does (`linked`) or does not own an account.
 * A section the URL does not name (or names wrongly) is the route's default; an open chapter also
 * counts as a visit to the Milestones cards above it; a redirect-only row is recorded and
 * followed to its target (one hop at a time, three at most).
 */
export function landingOf(goto, { linked, routePaths, sections, triage }, hops = 0) {
  const [pathname, asked] = routeLabel(goto).split(" · ");
  const route = matchRoute(pathname, routePaths);
  if (route === undefined) return ["unknown URL"];
  const list = sections.get(route) ?? [];
  if (list.length === 0) return follow(route, { linked, routePaths, sections, triage }, hops);

  const askedKey = asked === undefined ? undefined : keyFor(route, asked);
  if (askedKey !== undefined && triage.get(askedKey)?.verdict === "redirect-only") {
    return follow(askedKey, { linked, routePaths, sections, triage }, hops);
  }
  const section = list.some((s) => s.id === asked)
    ? asked
    : (DEFAULTS[route]?.(linked) ?? list[0].id);
  const keys = [keyFor(route, section)];
  if (route === CHAPTERS.path && section === CHAPTERS.section) {
    const chapterAsked = new URL(goto, "http://x").searchParams.get("chapter");
    const chapter = chapterAsked ?? (linked ? undefined : CHAPTERS.door);
    if (chapter) keys.push(keyFor(route, section, chapter));
  }
  return keys;
}

function follow(key, ctx, hops) {
  const row = ctx.triage.get(key);
  if (row?.verdict !== "redirect-only" || hops >= 3) return [key];
  const target = row.target?.split(/\s/)[0] ?? "";
  if (!target.startsWith("/")) return [key];
  return [key, ...landingOf(target, ctx, hops + 1)];
}

/** Index triage rows by join key; throws on an unknown verdict or two rows with one key. */
export function indexTriage(rows) {
  const out = new Map();
  for (const r of rows) {
    if (typeof r.screen !== "string" || !VERDICTS.has(r.verdict)) {
      throw new Error(`coverage: bad triage row ${JSON.stringify(r)}`);
    }
    const key = screenKey(r.screen);
    if (out.has(key)) throw new Error(`coverage: two triage rows for ${key}`);
    out.set(key, r);
  }
  return out;
}

/** screen key → the steps that land on it, per viewport: `{ phone: Set, desktop: Set }`. */
function visitsOf(journeys, ctx) {
  const steps = journeys.flatMap((member) =>
    member.journeys.flatMap((j) => j.steps.map((s) => ({ member, j, s }))),
  );
  const visits = new Map();
  for (const { member, j, s } of steps) {
    const linked = member.fixture?.kind === "session" && Boolean(member.fixture.participant);
    const label = `${member.member} ${j.id}-${s.id}`;
    const vps = viewportsFor(member, j).filter((vp) => stepRunsAt(s, vp));
    for (const k of landingOf(s.goto, { ...ctx, linked })) {
      if (!visits.has(k)) visits.set(k, { phone: new Set(), desktop: new Set() });
      for (const vp of vps) visits.get(k)[vp].add(label);
    }
  }
  return visits;
}

function statusOf(t, inCode, atPhone) {
  if (t === undefined) return "unjudged";
  if (NOT_LIVING.has(t.verdict)) return "never a gap";
  if (!inCode) return "stale";
  if (t.verdict === "undecided") return "undecided";
  return atPhone ? "covered" : "gap";
}

/**
 * The join. Returns `{ rows, headline, gaps, unjudged, stale }`; each row carries its phone and
 * desktop step lists. A gap is a living, decided row (keep · fold) no phone step visits.
 */
export function coverage({ screens, triageRows, journeys, routePaths, sections }) {
  const triage = indexTriage(triageRows);
  const visits = visitsOf(journeys, { routePaths, sections, triage });
  const screenKeys = new Set(screens.map((s) => s.key));
  const dockedOf = new Map(
    screens.map((s) => [s.key, s.section !== undefined && DOCKED.has(s.path)]),
  );
  const row = (key, t) => {
    const v = visits.get(key) ?? { phone: new Set(), desktop: new Set() };
    const docked = dockedOf.get(key) === true;
    return {
      screen: t?.screen ?? key,
      key,
      verdict: t?.verdict ?? "—",
      target: t?.target,
      mustBeSeenBy: t?.mustBeSeenBy,
      living: t !== undefined && !NOT_LIVING.has(t.verdict),
      docked,
      phone: [...v.phone],
      desktop: docked ? [] : [...v.desktop],
      status: statusOf(t, screenKeys.has(key), v.phone.size > 0),
    };
  };
  const rows = [...triage].map(([key, t]) => row(key, t));
  for (const s of screens) if (!triage.has(s.key)) rows.push(row(s.key, undefined));

  const living = rows.filter((r) => r.living);
  const covered = living.filter((r) => r.phone.length > 0).length;
  const gaps = rows.filter((r) => r.status === "gap");
  const undecided = rows.filter((r) => r.verdict === "undecided");
  const unjudged = rows.filter((r) => r.status === "unjudged");
  const stale = rows.filter((r) => r.status === "stale");
  const headline = `${covered} of ${living.length} living rows covered at phone · ${gaps.length} gaps · ${undecided.length} undecided`;
  return { rows, headline, gaps, unjudged, stale };
}

// ── the report ─────────────────────────────────────────────────────────────────────────────────

const MAX_VISITORS = 4;
const cell = (s) => String(s ?? "").replace(/\|/g, "\\|");
const code = (s) => `\`${cell(s)}\``;

function visitedBy(r) {
  const phone = r.phone;
  const desktopOnly = r.desktop.filter((s) => !phone.includes(s)).map((s) => `${s} (desktop)`);
  const all = [...phone, ...desktopOnly];
  if (all.length === 0) return "—";
  const shown = all.slice(0, MAX_VISITORS).join(", ");
  return all.length > MAX_VISITORS ? `${shown} + ${all.length - MAX_VISITORS} more` : shown;
}

function statusCell(r) {
  if (r.status === "never a gap") return `never a gap (→ ${code(r.target)})`;
  if (r.status === "undecided") return `undecided — ${cell(r.target)}`;
  if (r.status === "unjudged") return "**unjudged — add it to triage.json**";
  if (r.status === "stale") return "**stale — no screen in the code matches**";
  return r.status === "gap" ? "**gap**" : "covered";
}

export function renderMarkdown(result) {
  const out = [
    "# Journey coverage — every living screen, at phone width",
    "",
    `**${result.headline}**`,
    "",
    "_Generated by `npm run crawl:coverage` (`scripts/crawl/coverage.mjs`) from the route tree, each route's sections, the server's own pages, `docs/members/triage.json` (the verdicts, hand-maintained) and `e2e/journeys/*.journey.json`. Never hand-edit this file — change a verdict in `triage.json` or add a journey step, then re-run. A step visits the screen its `goto` lands on; the numbers are steps, not members. Trade's sections read `docked` at desktop: there they share one bench, so only a phone step shows one alone._",
    "",
  ];
  if (result.unjudged.length > 0 || result.stale.length > 0) {
    out.push(
      `> **${result.unjudged.length} unjudged · ${result.stale.length} stale** — a screen the code has and triage does not, or a living verdict for a screen that is gone. Fix \`triage.json\`.`,
      "",
    );
  }
  out.push(
    "| Screen | Verdict | Must be seen by | Phone | Desktop | Visited by (member journey step) | Status |",
    "|---|---|---|---|---|---|---|",
  );
  for (const r of result.rows) {
    const desktop = r.docked ? "docked" : String(r.desktop.length);
    out.push(
      `| ${code(r.screen)} | ${r.verdict} | ${cell(r.mustBeSeenBy ?? "—")} | ${r.phone.length} | ${desktop} | ${cell(visitedBy(r))} | ${statusCell(r)} |`,
    );
  }
  out.push("");
  return out.join("\n");
}

// ── the run ────────────────────────────────────────────────────────────────────────────────────

const readOrUndefined = (p) => (existsSync(p) ? readFileSync(p, "utf8") : undefined);

function modulePath(mod) {
  const hit = [".tsx", ".ts"].map((ext) => `app/src/${mod}${ext}`).find((p) => existsSync(p));
  if (!hit) throw new Error(`coverage: no file for app/src/${mod}`);
  return hit;
}

function collect() {
  const routes = parseRouteTree(readFileSync(ROUTE_TREE, "utf8"));
  const sections = new Map();
  for (const r of routes) {
    const list = r.modules.flatMap((m) => sectionsOf(modulePath(m), readOrUndefined));
    if (list.length > 0) sections.set(r.path, list);
  }
  for (const p of SERVER_PAGES) {
    if (p.file && !readFileSync(p.file, "utf8").includes(p.needle)) {
      throw new Error(`coverage: ${p.screen} — ${p.file} no longer contains ${p.needle}`);
    }
  }
  const chapters = parseChapters(readFileSync(CHAPTERS.file, "utf8"), CHAPTERS.name);
  const screens = buildScreens({ routes, sections, chapters, serverPages: SERVER_PAGES });
  return coverage({
    screens,
    triageRows: JSON.parse(readFileSync(TRIAGE, "utf8")),
    journeys: loadJourneys(),
    routePaths: routes.map((r) => r.path),
    sections,
  });
}

function main() {
  const args = process.argv.slice(2);
  const result = collect();
  if (args.includes("--json")) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    const out = args.includes("--out") ? args[args.indexOf("--out") + 1] : OUT;
    writeFileSync(out, renderMarkdown(result));
    console.log(`coverage: ${result.headline} → ${out}`);
    for (const r of [...result.gaps, ...result.unjudged, ...result.stale]) {
      console.log(`  ${r.status}: ${r.screen} — must be seen by ${r.mustBeSeenBy ?? "—"}`);
    }
  }
  if (result.unjudged.length > 0 || result.stale.length > 0) process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) main();
