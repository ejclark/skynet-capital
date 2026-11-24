#!/usr/bin/env node
// THE COHESION CENSUS (#8005 slice 1) — do the features read as one product? Plan #8005 tests that
// with simulated members later; this is the part that needs no model, and its numbers are the
// scorecard's model-free rows (the plan's falsifier reads two of them: fewer than 3 label
// collisions and fewer than 3 homeless features by 2026-12-07 re-scopes the plan).
//
//   npm run cohesion:census              # writes docs/members/cohesion.md, prints the five numbers
//   npm run cohesion:census -- --json    # the measures as JSON on stdout, writes nothing
//   npm run cohesion:census -- --update  # also lowers cohesion-budget.json where a count fell
//
// ADVISORY WITH A RATCHET, NEVER A RED GATE (the plan's constraint; docs/COACHES.md: taste and debt
// are a ratchet). A count above its budget is flagged ▲ in the report and the output, and the run
// still exits 0; `--update` lowers a budget to a lower count and never raises one.
//
// WHERE EACH NUMBER COMES FROM — the code first, the IA second, nothing typed for the census alone:
//   1. label collisions: the words that name places — the top tabs, every section, window and
//      chapter label, every door link whose words are a name, Moneypenny's place names
//      (`src/companion/places.ts`) — each resolved to the screen it lands on by coverage.mjs's own
//      `landingOf`, and each screen to its IA group by `home` in docs/members/triage.json.
//   2. concepts with more than one home: docs/IA.md §2f (each member concept and the screens that
//      hold it as a section or window body) × those screens' homes.
//   3. links that drop the key: every in-app link to a keyed page (docs/IA.md §3) that carries none
//      of a key its source file holds — candidates, each with its file and line.
//   4. features with no IA home: living screens triage.json places nowhere; parts (a shell or route
//      component) added since the study that docs/IA.md never cites, themselves or by a part above
//      them; and member routes added since the study that no screen or chat tool reads.
//   5. open IA ledger rows: docs/IA.md §10, every row whose status is not closed.
//
// THE HARVEST DOES NOT FIT ROW 1, said out loud: `scripts/study/harvest.mjs` reads a census walk of
// a study world (a browser, a server), and its strings carry no link targets, so it can say which
// words a route shows but never which place a word names. The census reads the same words from the
// code that renders them instead; a round's `strings.json` stays the study's input.
//
// History: rows 4b and 4c read git back to the study (2026-10-09). A shallow clone's cut-off commit
// has no parent there, so git diffs it against an empty tree and every file in it reads as added
// (#8065: 260 parts "since the study" where full history has 96). Both rows skip the cut-off
// commits, so a shallow clone can only undercount; when a cut-off falls on or after the study, the
// output and the report say so, and `--update` keeps the budget rather than lower it to that count.

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { isMain } from "../is-main.mjs";
import {
  againstBudget,
  apiPaths,
  checkHomes,
  conceptHomes,
  HOMES,
  importsOf,
  isName,
  keyDrops,
  labelCollisions,
  ledgerRows,
  lowered,
  normalizeName,
  OUTSIDE_THE_MODEL,
  parseConcepts,
  parseLabelRecord,
  parsePlaces,
  placeParts,
  scanLinks,
} from "./cohesion-plan.mjs";
import { landingOf, readScreens, screenKey } from "./coverage.mjs";

const IA = "docs/IA.md";
const TRIAGE = "docs/members/triage.json";
const OUT = "docs/members/cohesion.md";
const BUDGET = "cohesion-budget.json";
/** The member study the plan counts from (`docs/members/study/profile-2026-10/`). */
const SINCE = "2026-10-09";
const ROOT = "app/src/routes/__root.tsx";
const MISSION = "app/src/live/mission.ts";
const MILESTONES = "app/src/shell/milestones-section.tsx";
const PLACES = "src/companion/places.ts";
const NOT_LIVING = new Set(["retire", "redirect-only"]);
/** Door words that are actions, not names — "Back" to two places is not a collision. */
const NOT_NAMES = new Set([
  "back",
  "more",
  "here",
  "this",
  "detail",
  "change",
  "edit",
  "try again",
  "cancel",
  "done",
  "next",
  "start",
  "continue",
  "learn more",
  "read more",
  "all",
  "show all",
]);

const read = (p) => readFileSync(p, "utf8");
const git = (args, cwd = ".") =>
  execFileSync("git", args, { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

function walk(dir, keep) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p, keep));
    else if (keep(p)) out.push(p);
  }
  return out;
}
const isSource = (p) =>
  /\.(ts|tsx)$/.test(p) && !/\.(spec|test)\.tsx?$/.test(p) && !p.endsWith(".d.ts");

// ── the screens and their homes ─────────────────────────────────────────────────────────────────

function homesOf(triageRows) {
  const allowed = new Set([...Object.keys(HOMES), OUTSIDE_THE_MODEL]);
  const homeOf = new Map();
  for (const r of triageRows) {
    if (r.home !== undefined && !allowed.has(r.home)) {
      throw new Error(
        `cohesion: triage row ${r.screen} has home "${r.home}" — not one of ${[...allowed].join(", ")}`,
      );
    }
    homeOf.set(screenKey(r.screen), r.home);
  }
  return homeOf;
}

// ── 1. names ────────────────────────────────────────────────────────────────────────────────────

/** Where a link or a place name lands: `{ place, level }`, or undefined off the member app. */
function placeOf(to, values, ctx) {
  const path = to.replace(/\$\w+/g, "x");
  if (values.w)
    return { place: values.w === "overview" ? "/" : `/ ?w=${values.w}`, level: "screen" };
  const query = values.section
    ? `?section=${values.section}${values.chapter ? `&chapter=${values.chapter}` : ""}`
    : "";
  const keys = landingOf(`/app${path}${query}`, ctx);
  const last = keys[keys.length - 1];
  if (last === undefined || last === "unknown URL") return undefined;
  const named = Boolean(values.section) || keys.length > 1;
  return named ? { place: last, level: "screen" } : { place: to, level: "page", lands: last };
}

function collectNames(cov, homeOf, files) {
  const ctx = {
    linked: true,
    routePaths: cov.routePaths,
    sections: cov.sections,
    triage: cov.triage,
    windows: cov.windows,
  };
  const names = [];
  const add = (raw, at, source) => {
    const word = normalizeName(raw);
    if (!(at && word) || NOT_NAMES.has(word)) return;
    names.push({
      word,
      raw,
      place: at.place,
      level: at.level,
      home: homeOf.get(at.lands ?? at.place),
      source,
    });
  };
  for (const [path, list] of cov.sections) {
    for (const s of list)
      add(s.label, { place: `${path} ?section=${s.id}`, level: "screen" }, "section label");
  }
  for (const [id, label] of Object.entries(parseLabelRecord(read(MISSION), "WINDOW_LABEL"))) {
    add(label, { place: id === "overview" ? "/" : `/ ?w=${id}`, level: "screen" }, "window label");
  }
  for (const [id, label] of Object.entries(parseLabelRecord(read(MILESTONES), "CHAPTER_NAMES"))) {
    add(
      label,
      { place: `/accounts ?section=milestones&chapter=${id}`, level: "screen" },
      "chapter name",
    );
  }
  for (const { file, links } of files) {
    for (const l of links) {
      // A door whose search names its place by a variable can't be resolved from the text: skip it
      // rather than misread it as a door to the bare page.
      const unresolved = l.hasSearch && !l.values.section && !l.values.w;
      if (l.text && isName(l.text) && !unresolved)
        add(l.text, placeOf(l.to, l.values, ctx), `${file}:${l.line}`);
    }
  }
  for (const p of parsePlaces(read(PLACES)))
    add(p.name, placeOf(p.path, {}, ctx), "Moneypenny's place name");
  return names;
}

// ── 4. homeless ─────────────────────────────────────────────────────────────────────────────────

/** A shallow clone's cut-off commits (`.git/shallow`): parentless here, though not in history. */
function cutOffs(cwd) {
  const file = resolve(cwd, git(["rev-parse", "--git-path", "shallow"], cwd).trim());
  return new Set(existsSync(file) ? read(file).split("\n").filter(Boolean) : []);
}

/** Why rows 4b and 4c may undercount here: a cut-off commit dated on or after the study. */
export function historyNote(cwd = ".") {
  const cuts = [...cutOffs(cwd)];
  if (cuts.length === 0) return null;
  const last = git(["log", "--no-walk", "--format=%cs", ...cuts], cwd)
    .split("\n")
    .filter(Boolean)
    .sort()
    .at(-1);
  return last && last >= SINCE
    ? `history is cut off at ${last}, on or after ${SINCE} — run \`git fetch --shallow-since=2026-10-01 origin main\` and re-run; rows 4b and 4c undercount until then`
    : null;
}

/** Parts (`app/src/shell/*.tsx`, `app/src/routes/*.tsx`) added since the study, with the scope of
 *  the commit that added each. A shallow clone's cut-off commits add nothing. */
export function addedParts(cwd = ".") {
  const cuts = cutOffs(cwd);
  const log = git(
    ["log", `--since=${SINCE}`, "--diff-filter=A", "--name-only", "--format=@@%H %s", "HEAD"],
    cwd,
  );
  const out = new Map();
  let scope = "";
  let skip = false;
  for (const line of log.split("\n")) {
    if (line.startsWith("@@")) {
      skip = cuts.has(line.slice(2, line.indexOf(" ")));
      const m = line.slice(line.indexOf(" ") + 1).match(/^(\w+)(?:\(([^)]+)\))?/);
      scope = m ? (m[2] ? `${m[1]}(${m[2]})` : m[1]) : "other";
    } else if (
      !skip &&
      /^app\/src\/(shell|routes)\/[^/]+\.tsx$/.test(line) &&
      existsSync(join(cwd, line)) &&
      !out.has(line)
    ) {
      out.set(line, scope);
    }
  }
  return [...out]
    .map(([file, s]) => ({ file, scope: s }))
    .sort((a, b) => (a.file < b.file ? -1 : 1));
}

/** A path counts as named only as a whole: `/api/convictions` is not named by `/api/convictions/mine`. */
const namesPath = (src, p) =>
  new RegExp(`${p.replace(/[/-]/g, "\\$&")}(?![a-z0-9/_-])`, "i").test(src);

/** The member routes src/server serves, and those no screen or chat tool names (row 4c's test,
 *  without its history: the placement check diffs this between a base and its branch). */
function apiReach(appSrc, companionSrc) {
  const served = apiPaths(walk("src/server", isSource).map(read).join("\n")).sort();
  return {
    served,
    unread: served.filter((p) => !(namesPath(appSrc, p) || namesPath(companionSrc, p))),
  };
}

/** The `/api/…` paths src/server's history adds since the study (row 4c's input). */
export function serverAdditions(cwd = ".") {
  const cuts = cutOffs(cwd);
  // %x01 marks each commit: no diff line can start with it, unlike `@@` (a hunk header).
  const diff = git(
    ["log", `--since=${SINCE}`, "-p", "--format=%x01%H", "HEAD", "--", "src/server"],
    cwd,
  );
  const added = [];
  let skip = false;
  for (const line of diff.split("\n")) {
    if (line.startsWith("\x01")) skip = cuts.has(line.slice(1));
    else if (!skip && line.startsWith("+")) added.push(line);
  }
  return apiPaths(added.join("\n")).sort();
}

/** Member routes added to src/server since the study that nothing in the app or the chat names. */
function servedNotRendered(appSrc, companionSrc) {
  const added = new Set(serverAdditions());
  const server = walk("src/server", isSource).map(read).join("\n");
  return [...added]
    .filter((p) => namesPath(server, p))
    .filter((p) => !(namesPath(appSrc, p) || namesPath(companionSrc, p)))
    .sort();
}

// ── the run ─────────────────────────────────────────────────────────────────────────────────────

/** Every `.tsx` under app/src with its text and its links — the names pass's and row 3's input. */
const linkFiles = (appFiles) =>
  appFiles
    .filter((f) => f.endsWith(".tsx"))
    .map((file) => {
      const src = read(file);
      return { file, src, links: scanLinks(src) };
    });

/**
 * The member-facing set, read from the tree under the current directory with no git: every screen
 * the code has (a route, a section, a chapter, a landing window, a server page, a shell part) with
 * its triage verdict and IA home, and every name the names pass reads (a tab or door that names a
 * place, a section, window or chapter label, Moneypenny's place names). The placement check
 * (`placement.mjs`, #8005 slice 2) diffs this between a branch and its base, so a base tree that
 * `git archive` unpacked reads the same way: `needles: false` skips coverage's proof that each
 * hand-listed page still exists, which a base older than the list cannot pass.
 */
export function memberFacing({ needles = true } = {}) {
  const cov = readScreens({ needles });
  const homeOf = homesOf(cov.triageRows);
  const appFiles = walk("app/src", isSource);
  const names = collectNames(cov, homeOf, linkFiles(appFiles));
  const api = apiReach(
    appFiles.map(read).join("\n"),
    walk("src/companion", isSource).map(read).join("\n"),
  );
  const screens = cov.screens.map((s) => ({
    key: s.key,
    path: s.path,
    home: homeOf.get(s.key),
    verdict: cov.triage.get(s.key)?.verdict,
  }));
  return { screens, names, api };
}

export function measure() {
  const ia = read(IA);
  checkHomes(ia);
  const cov = readScreens();
  const triageRows = JSON.parse(read(TRIAGE));
  const homeOf = homesOf(triageRows);
  const appFiles = walk("app/src", isSource);
  const files = linkFiles(appFiles);

  const labels = labelCollisions(collectNames(cov, homeOf, files));
  const concepts = conceptHomes(parseConcepts(ia), homeOf);
  const multiHome = concepts.filter((c) => c.homes.length > 1);
  const drops = keyDrops(files, { appLevel: new Set([ROOT]) });

  const homelessScreens = triageRows
    .filter((r) => !NOT_LIVING.has(r.verdict) && r.home === undefined)
    .map((r) => ({ screen: r.screen, verdict: r.verdict }));
  const graph = new Map(appFiles.map((f) => [f, importsOf(f, read(f), existsSync)]));
  const parts = placeParts(addedParts(), graph, ia);
  const appSrc = appFiles.map(read).join("\n");
  const companionSrc = walk("src/companion", isSource).map(read).join("\n");
  const served = servedNotRendered(appSrc, companionSrc);
  const ledger = ledgerRows(ia);

  const homelessParts = parts.filter((p) => p.status === "homeless");
  const counts = {
    labelCollisions: labels.oneWordManyPlaces.length + labels.onePlaceManyWords.length,
    multiHomeConcepts: multiHome.length,
    keyDrops: drops.length,
    homeless: homelessScreens.length + homelessParts.length + served.length,
    openLedgerRows: ledger.filter((r) => r.open).length,
  };
  return {
    counts,
    labels,
    concepts,
    multiHome,
    drops,
    homelessScreens,
    parts,
    served,
    ledger,
    history: historyNote(),
  };
}

// ── the report ──────────────────────────────────────────────────────────────────────────────────

const cell = (s) => String(s ?? "").replace(/\|/g, "\\|");
const code = (s) => `\`${cell(s)}\``;
const LABEL = {
  labelCollisions: "Label collisions — one word for many places, one place under many words",
  multiHomeConcepts: "Concepts with more than one home",
  keyDrops: "Links that drop the account, symbol or date key (candidates)",
  homeless: "Member-facing features with no IA home",
  openLedgerRows: "Open IA ledger rows (docs/IA.md §10)",
};

export function renderMarkdown(m, verdicts) {
  const fold = (summary, lines) => [
    "<details>",
    `<summary>${summary}</summary>`,
    "",
    ...lines,
    "",
    "</details>",
    "",
  ];
  const out = [
    "# Cohesion census — do the features read as one product?",
    "",
    `**${m.counts.labelCollisions} label collisions · ${m.counts.multiHomeConcepts} concepts with more than one home · ${m.counts.keyDrops} links that drop a key · ${m.counts.homeless} features with no IA home · ${m.counts.openLedgerRows} open ledger rows**`,
    "",
    "_Generated by `npm run cohesion:census` (`scripts/crawl/cohesion.mjs`, plan #8005 slice 1) from the code, `docs/IA.md` (§2f concepts, §3 keys, §10 ledger), `docs/members/triage.json` (each screen's verdict and IA home) and git history since the study (2026-10-09). Never hand-edit this file — change the IA or a triage row, then re-run. Advisory: a count above its budget (`cohesion-budget.json`) is flagged ▲ and never fails a build; `--update` lowers a budget, never raises it._",
    "",
  ];
  if (m.history) out.push(`> **History is short:** ${m.history}.`, "");
  out.push("| Measure | Now | Budget | |", "|---|---|---|---|");
  for (const v of verdicts) {
    out.push(
      `| ${LABEL[v.measure]} | ${v.now} | ${v.budget ?? "—"} | ${v.rose ? "▲ above budget" : v.budget === null ? "no budget yet" : "✓"} |`,
    );
  }
  out.push("");

  out.push("## 1. Label collisions", "", "### One word for many places", "");
  out.push(
    "A word that names places in two or more IA groups: a member who learns it in one place expects the same thing in the other.",
    "",
  );
  out.push("| Word | IA groups | Places it names |", "|---|---|---|");
  for (const c of m.labels.oneWordManyPlaces) {
    out.push(`| ${cell(c.word)} | ${c.homes.join(" · ")} | ${c.places.map(code).join(" · ")} |`);
  }
  out.push("", "### One place under many words", "");
  out.push(
    "A page (a tab, a door to it, Moneypenny's name for it) or a screen (a section, a window, a chapter, a door to it) named more than one way.",
    "",
  );
  out.push("| Place | Level | Words |", "|---|---|---|");
  for (const c of m.labels.onePlaceManyWords)
    out.push(`| ${code(c.place)} | ${c.level} | ${c.words.map(cell).join(" · ")} |`);
  out.push("");
  const sources = [...m.labels.oneWordManyPlaces, ...m.labels.onePlaceManyWords].flatMap((c) =>
    c.names.map(
      (n) => `- ${cell(n.raw)} → ${code(n.place)} (${n.home ?? "no home"}) — ${cell(n.source)}`,
    ),
  );
  out.push(...fold("Where each word comes from", [...new Set(sources)]));

  out.push("## 2. Concepts with more than one home", "");
  out.push(
    "Each member concept (docs/IA.md §2f) and the IA groups of the screens that hold it as a section or a window.",
    "",
  );
  out.push("| Concept | A member reads | Homes | Screens |", "|---|---|---|---|");
  for (const c of m.multiHome)
    out.push(
      `| ${code(c.id)} | ${cell(c.words)} | ${c.homes.join(" · ")} | ${c.screens.map(code).join(" · ")} |`,
    );
  out.push("");
  out.push(
    ...fold(
      `Every concept (${m.concepts.length})`,
      m.concepts.map((c) => `- ${code(c.id)} — ${c.homes.join(" · ")}`),
    ),
  );

  out.push("## 3. Links that drop the key", "");
  out.push(
    "A link into a keyed page (docs/IA.md §3) that carries none of a key its source file holds, so the member lands on the page's default instead of the row they came from. Candidates: the source holding a key is read from its text, so each row is for a person or a journey to judge.",
    "",
  );
  const byKey = {};
  for (const d of m.drops) byKey[d.key] = (byKey[d.key] ?? 0) + 1;
  out.push(
    `By key: ${
      Object.entries(byKey)
        .map(([k, n]) => `${k} ${n}`)
        .join(" · ") || "none"
    }.`,
    "",
  );
  out.push(
    ...fold(
      `All ${m.drops.length}`,
      m.drops.map(
        (d) =>
          `- ${code(`${d.file}:${d.line}`)} → ${code(d.to)} drops **${d.key}**${d.text ? ` ("${cell(d.text)}")` : ""}`,
      ),
    ),
  );

  out.push("## 4. Member-facing features with no IA home", "");
  out.push(`### Screens triage.json places in no IA group (${m.homelessScreens.length})`, "");
  for (const s of m.homelessScreens) out.push(`- ${code(s.screen)} (${s.verdict})`);
  const homeless = m.parts.filter((p) => p.status === "homeless");
  const placed = m.parts.filter((p) => p.status === "placed");
  const unmounted = m.parts.filter((p) => p.status === "not mounted");
  out.push(
    "",
    `### Parts added since ${SINCE}: ${placed.length} placed · ${homeless.length} homeless · ${unmounted.length} not mounted`,
    "",
  );
  out.push(
    "A part is placed when docs/IA.md cites its file, or a part above it that is not a route.",
    "",
  );
  for (const p of homeless) out.push(`- ${code(p.file)} — ${cell(p.scope)}`);
  out.push("");
  out.push(
    ...fold(`Placed (${placed.length}) and not mounted (${unmounted.length})`, [
      ...placed.map((p) => `- ${code(p.file)} — ${cell(p.scope)} — via ${code(p.via)}`),
      ...unmounted.map((p) => `- ${code(p.file)} — ${cell(p.scope)} — no route reaches it`),
    ]),
  );
  out.push(
    `### Served, not rendered: member routes added since ${SINCE} that no screen or chat tool names (${m.served.length})`,
    "",
  );
  for (const p of m.served) out.push(`- ${code(p)}`);
  out.push("");

  out.push("## 5. Open IA ledger rows", "");
  out.push("| Row | Root | Status |", "|---|---|---|");
  for (const r of m.ledger.filter((x) => x.open))
    out.push(`| ${r.id} | ${cell(r.root)} | ${cell(r.status)} |`);
  out.push("");
  return out.join("\n");
}

function main() {
  const args = process.argv.slice(2);
  const m = measure();
  const budget = existsSync(BUDGET) ? JSON.parse(read(BUDGET)) : null;
  const verdicts = againstBudget(m.counts, budget);
  if (args.includes("--json")) {
    console.log(JSON.stringify({ ...m, verdicts }, null, 2));
    return;
  }
  writeFileSync(OUT, renderMarkdown(m, verdicts));
  // A cut-off history undercounts rows 4b and 4c, so its low count is no reason to lower a budget.
  if (args.includes("--update") && !m.history)
    writeFileSync(BUDGET, `${JSON.stringify(lowered(m.counts, budget), null, 2)}\n`);
  console.log(`cohesion: → ${OUT}`);
  for (const v of verdicts) {
    console.log(
      `  ${v.rose ? "▲" : " "} ${String(v.now).padStart(3)}  ${LABEL[v.measure]}${v.budget === null ? "" : ` (budget ${v.budget})`}`,
    );
  }
  if (m.history)
    console.log(`  ⚠ ${m.history}${args.includes("--update") ? " (budget left as it was)" : ""}`);
}

if (isMain(import.meta.url)) main();
