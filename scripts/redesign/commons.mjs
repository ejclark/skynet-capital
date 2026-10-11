// THE REDESIGN COMMONS (#5143) — how parallel screen sessions share one design language without
// messaging each other: a protocol page (commons.md) and an append-only findings log beside it.
//
//   node scripts/redesign/commons.mjs add --screen <id> --kind <kind> --what "…" [--where … --principle … --to … --why …]
//   node scripts/redesign/commons.mjs read [--n 50]     # commons.md, then the last N findings
//   node scripts/redesign/commons.mjs digest            # markdown: by kind, shared spots, IA moves
//
// WHY A SCRIPT: nineteen sessions appended hand-typed JSON with printf, so a typo'd kind or a
// missing `to` on an IA move went unseen until the curator tripped on it. `add` validates and
// writes one line (an O_APPEND write of one line, safe with sessions appending at once); `digest`
// does the curator's first pass — the same problem found on several screens, and every section a
// screen wants moved elsewhere (Eric, 2026-10-11: sections may be combined or transplanted "to
// areas better suited to achieve goals and in proximity to associated information"), as from → to.
//
// WHERE: REDESIGN_COMMONS names the folder (or the findings .jsonl itself); by default it is the
// project's shared temp folder, /tmp/claude-<uid>/<checkout slug>/redesign-commons — the same
// folder from every worktree of this checkout.

import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const KINDS = ["component", "pattern", "wording", "data", "request", "ia-move"];
const FIELDS = ["screen", "kind", "what", "where", "principle", "to", "why"];
const NEEDS_TO = {
  "ia-move": "an ia-move needs --to (the screen/section it should move to)",
  request: "a request needs --to (the owner it is asked of)",
};
const STOP = new Set(
  "the and for with from that this its into onto than then when what where which who why how are was were has have not but any all one two each every only also just more most less via per on in of to a an as at by is it or be".split(
    " ",
  ),
);

/** `{ dir, log, page }` — the commons folder, its findings log and its protocol page. */
export function commonsPaths(env = process.env) {
  const set = env.REDESIGN_COMMONS;
  if (set) {
    const log = set.endsWith(".jsonl") ? set : join(set, "findings.jsonl");
    return { dir: dirname(log), log, page: join(dirname(log), "commons.md") };
  }
  const here = fileURLToPath(new URL("../../", import.meta.url));
  const git = spawnSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], {
    cwd: here,
    encoding: "utf8",
  });
  const checkout = git.status === 0 ? dirname(git.stdout.trim()) : here.replace(/\/$/, "");
  const tmp = process.platform === "darwin" ? "/private/tmp" : "/tmp";
  const dir = join(
    tmp,
    `claude-${process.getuid?.() ?? 0}`,
    checkout.replace(/[^A-Za-z0-9]/g, "-"),
    "redesign-commons",
  );
  return { dir, log: join(dir, "findings.jsonl"), page: join(dir, "commons.md") };
}

/** `--flag value` pairs → an object; throws on a flag it does not know or one with no value. */
export function parseFlags(argv, known) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i].replace(/^--/, "");
    if (!known.includes(flag)) throw new Error(`commons: unknown option ${argv[i]}`);
    if (argv[i + 1] === undefined) throw new Error(`commons: --${flag} needs a value`);
    out[flag] = argv[i + 1];
  }
  return out;
}

/** A finding ready to append, or every reason it is not. `ids`: the screens a session can be. */
export function makeFinding(flags, ids, now = new Date()) {
  const problems = [];
  if (!ids.includes(flags.screen)) problems.push(`--screen is one of: ${ids.join(", ")}`);
  if (!KINDS.includes(flags.kind)) problems.push(`--kind is one of: ${KINDS.join(", ")}`);
  const what = (flags.what ?? "").trim();
  if (!what) problems.push("--what says the finding in one line");
  else if (what.length > 140) problems.push(`--what is ${what.length} characters — keep it to 140`);
  if (NEEDS_TO[flags.kind] && !flags.to?.trim()) problems.push(NEEDS_TO[flags.kind]);
  if (flags.kind === "ia-move" && !flags.why?.trim())
    problems.push(
      "an ia-move needs --why (the goal it serves and the information it would sit beside)",
    );
  for (const f of FIELDS)
    if ((flags[f] ?? "").length > 300) problems.push(`--${f} is over 300 characters`);
  if (problems.length > 0) return { problems };
  const finding = { at: now.toISOString().replace(/\.\d{3}Z$/, "Z") };
  for (const f of FIELDS) if (flags[f]?.trim()) finding[f] = flags[f].trim();
  return { finding, problems };
}

/** The findings log, oldest first; a line that isn't JSON is kept as a note, never dropped. */
export function readFindings(log) {
  if (!existsSync(log)) return [];
  return readFileSync(log, "utf8")
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return { kind: "unreadable", what: l.slice(0, 140) };
      }
    });
}

/** One finding as one readable line. */
export function formatFinding(f) {
  const when = f.at ? `${String(f.at).slice(0, 16).replace("T", " ")} · ` : "";
  const where = f.where ? ` (${f.where})` : "";
  const to = f.to ? ` → ${f.to}` : "";
  const why = f.why ? `: ${f.why}` : f.principle ? ` [${f.principle}]` : "";
  return `- ${when}${f.screen ?? "?"} · ${f.kind}: ${f.what}${where}${to}${why}`;
}

const tokens = (f) =>
  new Set(
    `${f.what ?? ""} ${f.where ?? ""}`
      .toLowerCase()
      .replace(/:\d+/g, " ")
      .split(/[^a-z0-9%$]+/)
      .filter((t) => t.length > 2 && !STOP.has(t) && !/^\d+$/.test(t)),
  );
const jaccard = (a, b) => {
  let both = 0;
  for (const t of a) if (b.has(t)) both++;
  return both / (a.size + b.size - both || 1);
};

/** Findings whose what/where share most of their words, as clusters (single link, ≥ 0.34). */
export function clusters(findings) {
  const out = [];
  for (const f of findings) {
    const t = tokens(f);
    const home = out.find(
      (c) => c.kind === f.kind && c.items.some((g) => jaccard(tokens(g), t) >= 0.34),
    );
    if (home) home.items.push(f);
    else out.push({ kind: f.kind, items: [f] });
  }
  return out;
}

const screensOf = (items) => [...new Set(items.map((f) => f.screen ?? "?"))];

/** The curator's first pass, as markdown. */
export function digest(findings) {
  const all = screensOf(findings);
  const lines = [`# Commons digest — ${findings.length} findings from ${all.length} screens`, ""];
  lines.push("| Kind | Findings | Screens |", "|---|---|---|");
  for (const kind of [...KINDS, "unreadable"]) {
    const of = findings.filter((f) => f.kind === kind);
    if (of.length > 0) lines.push(`| ${kind} | ${of.length} | ${screensOf(of).length} |`);
  }
  const shared = clusters(findings.filter((f) => f.kind !== "ia-move"))
    .filter((c) => c.items.length > 1)
    .sort(
      (a, b) =>
        screensOf(b.items).length - screensOf(a.items).length || b.items.length - a.items.length,
    );
  lines.push("", "## The same thing, found more than once");
  if (shared.length === 0) lines.push("_Nothing yet: no two findings name the same thing._");
  for (const c of shared) {
    const s = screensOf(c.items);
    lines.push(`- **${c.kind}** · ${s.length} screen(s): ${s.join(", ")}`);
    for (const f of c.items)
      lines.push(`  - ${f.screen}: ${f.what}${f.where ? ` (${f.where})` : ""}`);
  }
  for (const kind of KINDS.filter((k) => k !== "ia-move")) {
    const of = findings.filter((f) => f.kind === kind);
    if (of.length === 0) continue;
    lines.push("", `## ${kind} — ${of.length} from ${screensOf(of).length} screen(s)`);
    for (const f of of) lines.push(formatFinding({ ...f, at: undefined }));
  }
  const moves = findings.filter((f) => f.kind === "ia-move");
  lines.push("", `## IA moves, from → to — ${moves.length}`);
  if (moves.length === 0) lines.push("_None yet._");
  for (const m of moves)
    lines.push(`- **${m.screen}** → **${m.to ?? "?"}**: ${m.what}${m.why ? ` — ${m.why}` : ""}`);
  return `${lines.join("\n")}\n`;
}

function main(argv) {
  const [verb, ...rest] = argv;
  const paths = commonsPaths();
  if (verb === "add") {
    const ids = JSON.parse(readFileSync(new URL("./screens.json", import.meta.url), "utf8")).map(
      (s) => s.id,
    );
    const { finding, problems } = makeFinding(parseFlags(rest, FIELDS), ids);
    if (problems.length > 0) throw new Error(problems.map((p) => `commons: ${p}`).join("\n"));
    mkdirSync(paths.dir, { recursive: true });
    appendFileSync(paths.log, `${JSON.stringify(finding)}\n`);
    console.log(`commons: added to ${paths.log}\n${formatFinding(finding)}`);
  } else if (verb === "read") {
    const n = Number(parseFlags(rest, ["n"]).n ?? 50);
    if (!Number.isInteger(n) || n < 1) throw new Error("commons: --n is a whole number");
    if (existsSync(paths.page)) console.log(readFileSync(paths.page, "utf8").trimEnd());
    else console.log(`(no ${paths.page} yet)`);
    const all = readFindings(paths.log);
    console.log(`\n## The last ${Math.min(n, all.length)} of ${all.length} findings\n`);
    for (const f of all.slice(-n)) console.log(formatFinding(f));
  } else if (verb === "digest") {
    process.stdout.write(digest(readFindings(paths.log)));
  } else {
    throw new Error("usage: node scripts/redesign/commons.mjs add|read|digest (see the header)");
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    main(process.argv.slice(2));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
