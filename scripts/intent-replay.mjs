#!/usr/bin/env node
// Replay real messages of Eric's, with and without the page on how he writes, and score what comes back.
//
// Eric, 2026-11-01: "document how I communicate... fitness tests to codify my intent". A page that says
// how to read him is only worth loading if a session reads him better with it, and the first replay
// (49 of 58 without, 51 of 58 with) did not show that. So this stays a repeatable test instead of a
// one-off: docs/evals/how-he-writes-set.json holds what he wrote and what his next message showed, and
// a correction that recurs becomes a case there (the /dream and /retro skills). A script cannot spawn a
// model, so the fan-out lives in .claude/workflows/intent-replay.js, which calls this for its cases and
// each answerer's prompt, and blinds the judge itself.
//
//   node scripts/intent-replay.mjs cases  [--n 2|4] [--set <file>] [--page <file>]
//   node scripts/intent-replay.mjs prompt --arm with|without --order forward|backward [--set <file>] [--page <file>]
//   node scripts/intent-replay.mjs prompt --judge [--set <file>]
//   node scripts/intent-replay.mjs score  --results <file> [--set <file>] [--json]
//
// What a score can and cannot say is in the set's own header: howThisCouldFlatterThePage.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { POSITION_SHAPES } from "./intents.mjs";
import { isMain } from "./is-main.mjs";

const SET_FILE = "docs/evals/how-he-writes-set.json";
const PAGE_FILE = "docs/READERS.md";
const DEFAULT_RUNS = 2;
const MAX_RUNS = 4;
const START_TOKENS = 30_000; // what docs/COMPUTE.md gives for a worker's start; output is on top
const LOOKUPS = 2; // the work-spigot read and the `cases` read, one mechanical agent each
const ROUTES = [
  "act-now",
  "park",
  "fan-out",
  "declare",
  "profile-note",
  "question",
  "decision",
  "status-check",
  "correction",
];
const ASKS = ["must-not-ask", "may-ask", "should-ask"];
const TEXT_FIELDS = ["said", "context", "evidence"];
const LIST_FIELDS = ["mustDo", "mustNotDo"];
const PAGE_SECTIONS = ["How he writes", "What breaks his flow"];

// The repo is public. A person's name has no shape, so that check fails closed: a capitalised word is
// a name until the set says otherwise, which makes adding a case cost one reviewed word in the header.
// A name he typed in lowercase passes this, which the header says to read for.
// STAYS OPEN, with a spec: the check is case-sensitive, so a name in capitals (PRIYA) passes it as well.
// Firing on capitals would have to clear every acronym the cases hold, and the one thing that could
// recognise a name is a list of the names, which would itself put them in a public repo. There is no
// such list here, by design: a person reads a new case for a name, which the header says to do.
// intents.mjs's first-person and "account" shapes are left out on purpose: "My gut tells me" is the
// wording under test, and Account is a screen.
const NEVER_PUBLIC = [
  [/[\w.+-]+@[\w-]+\.[\w.-]+/, "an email"],
  [/(?:^|[\s("'`])(?:\/(?:Users|home|private|tmp|var\/folders)\/|~\/)|\b[A-Z]:\\/, "a local path"],
  ...POSITION_SHAPES,
];
const CAPITALISED = /\b[A-Z][a-z]+(?:[A-Z][a-z]+)*\b/g;

/** What in this text must not be public, by name; [] when it is clean. */
export function shapeProblems(text) {
  return NEVER_PUBLIC.filter(([shape]) => shape.test(text)).map(([, what]) => what);
}

function caseProblems(row, allowed) {
  const id = row.id ?? "(no id)";
  const missing = [
    ...["id", "date", "confidence", ...TEXT_FIELDS].filter((name) => !row[name]),
    ...LIST_FIELDS.filter((name) => !row[name]?.length),
  ];
  const text = [...TEXT_FIELDS.map((name) => row[name]), ...LIST_FIELDS.flatMap((n) => row[n])]
    .filter(Boolean)
    .join("\n");
  const names = [...new Set(text.match(CAPITALISED) ?? [])].filter((word) => !allowed.has(word));
  return [
    ...missing.map((name) => `${id}: ${name} is missing`),
    ...(ROUTES.includes(row.route) ? [] : [`${id}: route ${row.route} is not one of the routes`]),
    ...(ASKS.includes(row.ask) ? [] : [`${id}: ask ${row.ask} is not one of the asks`]),
    ...shapeProblems(text).map((what) => `${id}: holds ${what}`),
    ...names.map(
      (word) =>
        `${id}: "${word}" could be a person: paraphrase it, or add a plain word to header.wordsThatAreNotNames`,
    ),
  ];
}

/** Every reason this set should not run or be public; [] when it is clean. */
export function setProblems(set) {
  const allowed = new Set(set.header?.wordsThatAreNotNames ?? []);
  const seen = new Set();
  return set.cases.flatMap((row) => {
    const repeat = seen.has(row.id) ? [`${row.id}: appears twice`] : [];
    seen.add(row.id);
    return [...repeat, ...caseProblems(row, allowed)];
  });
}

const sortedEntries = (row) => Object.entries(row).sort(([a], [b]) => (a < b ? -1 : 1));

/** What a case holds, as a short hash a result can carry. Any edit changes it; key order does not. */
export const caseDigest = (row) =>
  createHash("sha256")
    .update(JSON.stringify(sortedEntries(row)))
    .digest("hex")
    .slice(0, 16);

/** N passes per arm. On each pass the arms read opposite orders, so order cannot pose as the page. */
export function runsFor(n) {
  const pass = Array.from({ length: n }, (_, i) => i + 1);
  const named = (arm, firstOrder, lastOrder) =>
    pass.map((k) => ({ name: `${arm}-${k}`, arm, order: k % 2 ? firstOrder : lastOrder }));
  return [...named("without", "forward", "backward"), ...named("with", "backward", "forward")];
}

/** A set that fails the safety rule goes no further: not to a plan, a prompt or a score. */
function refuseUnsafe(set) {
  const problems = setProblems(set);
  if (problems.length) throw new Error(problems.join("; "));
}

/**
 * One run's plan, priced. N is even because each arm has to read both orders equally often: at N=1 each
 * arm reads one direction, so a gap between them could be the order and not the page, and an odd N only
 * shrinks that. The workflow holds the same rule, and a spec runs the two side by side.
 */
export function casesFor(set, { n = DEFAULT_RUNS } = {}) {
  if (!Number.isInteger(n) || n < 2 || n > MAX_RUNS || n % 2 !== 0) {
    throw new Error(
      `--n must be an even number from 2 to ${MAX_RUNS}, got ${n}: each arm has to read both orders equally`,
    );
  }
  refuseUnsafe(set);
  const answerers = n * 2;
  const agents = answerers + 1 + LOOKUPS;
  return {
    ids: set.cases.map((row) => row.id),
    caseDigests: set.cases.map(caseDigest),
    runs: runsFor(n),
    price: {
      answerers,
      judges: 1,
      lookups: LOOKUPS,
      agents,
      startTokens: agents * START_TOKENS,
    },
  };
}

const withoutHeadings = (text) =>
  text
    .split("\n")
    .filter((line) => !line.startsWith("#"))
    .join("\n")
    .trim();

/** What one section of the page says past its headings: empty when it is bare or gone. */
function sectionBody(page, name) {
  const section = page.split(/^#{2,3} /m).find((block) => block.startsWith(name));
  return withoutHeadings(section?.split("\n").slice(1).join("\n") ?? "");
}

/**
 * The two sections an answerer reads, from where sessions read them. The dated replay result is left
 * out: it says what is being tested, and the baseline's page did not carry it either. A section with
 * nothing in it throws, because both arms would then compare what is nearly one prompt, and a score on
 * that would read as the page not helping when the page never reached anyone.
 */
export function pageOf(readers) {
  const start = readers.indexOf("### How he writes");
  if (start === -1) throw new Error(`${PAGE_FILE} has no "How he writes" section`);
  const rest = readers.slice(start);
  const end = rest.search(/\n#{2,3} (?!How he writes|What breaks his flow)/);
  const page = (end === -1 ? rest : rest.slice(0, end))
    .split(/\n\s*\n/)
    .filter((paragraph) => !paragraph.startsWith("**Replay,"))
    .join("\n\n")
    .trim();
  const bare = PAGE_SECTIONS.filter((name) => !sectionBody(page, name));
  if (bare.length) throw new Error(`${PAGE_FILE} has nothing under: ${bare.join(", ")}`);
  return page;
}

/** Exactly what one answerer is told: each message and its context, and for one arm the page. */
export function answerPrompt(set, { arm, order, page }) {
  if (arm !== "with" && arm !== "without") throw new Error(`unknown arm ${arm}`);
  if (order !== "forward" && order !== "backward") throw new Error(`unknown order ${order}`);
  if (arm === "with" && !withoutHeadings(page ?? "")) {
    throw new Error("the with arm needs the page, and it is empty");
  }
  refuseUnsafe(set);
  const rows = order === "forward" ? set.cases : [...set.cases].reverse();
  const guide =
    arm === "with" ? `A guide to how he writes. Use it.\n\n${page}\n\n<<<end of guide>>>\n\n` : "";
  const messages = rows
    .map((row) => `${row.id} · context: ${row.context}\nHe writes: ${row.said}`)
    .join("\n\n");
  return `You are a working session in this repo. Each message below has just arrived from Eric, the owner, while you were in the middle of the work named in its context. For each one, return how you would route it, whether you would ask him anything back before acting, and the first thing you would do or write. Decide each one on its own.

Route: act-now, park, fan-out, declare, profile-note, question, decision (he is answering something you asked), status-check (he wants to know what is happening), correction (he is telling you something was wrong). Ask: must-not-ask, may-ask, should-ask.

This tests how a message is read, so do none of the work. Read no file, run no other command and change nothing: decide from this prompt alone. Keep firstMove to one line, as you would say or do it to him; a judge reads it knowing nothing else, so never say in it what you read or that this is a test.

${guide}${messages}`;
}

/** What the judge is told about each case. The answers come from the workflow, unlabelled. */
export function judgePrompt(set) {
  refuseUnsafe(set);
  const criteria = set.cases.map(({ id, said, context, mustDo, mustNotDo }) => ({
    id,
    said,
    context,
    mustDo,
    mustNotDo,
  }));
  return `Judge each answer against what Eric would have wanted. An answer passes when it does what mustDo says, or clearly heads there as a first move, and does nothing in mustNotDo. Judge only that. Do not reward length or polish. You have no other information about the answers, and you read nothing else.

${JSON.stringify(criteria)}`;
}

/** Which run filled a slot on a case. The workflow's blinding holds the same sum; a spec round-trips it. */
export const runOfSlot = (caseIndex, slot, runCount) => (slot + caseIndex) % runCount;

/** Same ids in the same order, each still holding what it held: a score means nothing otherwise. */
function requireSameCases(set, { runs, caseIds, caseDigests }) {
  if (!(Array.isArray(runs) && runs.length)) throw new Error("score needs the runs a workflow ran");
  const ids = set.cases.map((row) => row.id);
  if (JSON.stringify(caseIds) !== JSON.stringify(ids)) {
    throw new Error(`these results ran on another set: ${caseIds} against ${ids}`);
  }
  if (!Array.isArray(caseDigests)) {
    throw new Error("these results do not say what their cases held: run it again");
  }
  const changed = set.cases.filter((row, i) => caseDigests[i] !== caseDigest(row));
  if (changed.length) {
    const named = changed.map((row) => row.id).join(", ");
    throw new Error(`the set was rewritten since these results ran: ${named} changed`);
  }
}

/** A saved result can come from before the plan refused it, so the score holds the same rule. */
function requireBothOrders(runs) {
  for (const arm of ["without", "with"]) {
    const ofArm = runs.filter((run) => run.arm === arm);
    const forward = ofArm.filter((run) => run.order === "forward").length;
    if (forward * 2 !== ofArm.length || ofArm.length * 2 !== runs.length) {
      throw new Error(
        `the ${arm} arm read ${forward} of ${ofArm.length} runs forward, of ${runs.length} in all: the arms have to run equally and read both orders equally, or order poses as the page`,
      );
    }
  }
}

/** A judge that contradicts itself on a slot has not judged it, whichever row it wrote last. */
const slotOf = (row) => `${row.id}:${row.slot}`;
const withoutConflicts = (rows) =>
  rows.map((row) =>
    rows.some((other) => slotOf(other) === slotOf(row) && other.pass !== row.pass)
      ? { ...row, pass: undefined }
      : row,
  );

const tally = (of) => ({ route: 0, ask: 0, judged: 0, of, answered: 0, unjudged: 0 });

function addAnswer(row, answer, verdict, into) {
  for (const counts of into) {
    counts.answered += 1;
    if (answer.route === row.route) counts.route += 1;
    if (answer.ask === row.ask) counts.ask += 1;
    // Only a boolean is a judgement. A row with no pass, or pass: "true", was not judged at all.
    if (typeof verdict?.pass !== "boolean") counts.unjudged += 1;
    else if (verdict.pass) counts.judged += 1;
  }
}

/**
 * The workflow's return value, per run and per arm. An answer that never came back, or a verdict that
 * did not, makes the comparison unknown: neither a low score nor a clean one.
 */
export function scoreReplay(set, result) {
  refuseUnsafe(set);
  requireSameCases(set, result ?? {});
  requireBothOrders(result.runs);
  const { runs } = result;
  const verdicts = withoutConflicts(result.verdicts ?? []);
  const passOf = new Map(verdicts.map((row) => [`${row.id}:${row.slot}`, row]));
  const byRun = Object.fromEntries(runs.map((run) => [run.name, tally(set.cases.length)]));
  const perArm = runs.filter((run) => run.arm === "with").length * set.cases.length;
  const arms = { without: tally(perArm), with: tally(perArm) };
  const differs = [];
  set.cases.forEach((row, caseIndex) => {
    const passed = { without: 0, with: 0 };
    for (let slot = 0; slot < runs.length; slot++) {
      const run = runs[runOfSlot(caseIndex, slot, runs.length)];
      const answer = run.answers?.find((a) => a.id === row.id);
      if (!answer) continue;
      const verdict = passOf.get(`${row.id}:${slot}`);
      addAnswer(row, answer, verdict, [byRun[run.name], arms[run.arm]]);
      if (verdict?.pass === true) passed[run.arm] += 1;
    }
    if (passed.without !== passed.with) differs.push({ id: row.id, ...passed });
  });
  const complete = Object.values(arms).every((arm) => arm.answered === arm.of && !arm.unjudged);
  const verdict = !complete
    ? "unknown"
    : arms.with.judged > arms.without.judged
      ? "page above"
      : "page not above";
  // Over a missing answer, a difference between the arms would read as one arm losing the case.
  const named = complete ? differs : [];
  return { arms, byRun, differs: named, verdict, baseline: set.header?.baseline ?? null };
}

const armLine = (name, arm) =>
  `${name}: judged ${arm.judged} of ${arm.of} · route ${arm.route} · ask ${arm.ask}${arm.answered < arm.of ? ` · ${arm.of - arm.answered} never answered` : ""}${arm.unjudged ? ` · ${arm.unjudged} not judged` : ""}`;

function summary({ arms, differs, verdict, baseline }) {
  const lines = [armLine("without the page", arms.without), armLine("with the page", arms.with)];
  if (verdict === "unknown") {
    lines.push(
      "verdict: unknown. The lines above say what is missing: no comparison stands on it.",
    );
  } else {
    lines.push(
      `verdict: ${verdict}. A gap of a point or two is inside what one arm moves between its own two runs.`,
      `differ: ${differs.map((d) => `${d.id} (${d.without} without, ${d.with} with)`).join(", ") || "none"}`,
    );
  }
  if (baseline) {
    lines.push(
      `baseline ${baseline.date}: judged ${baseline.without.judged} without, ${baseline.with.judged} with, of ${baseline.of}`,
    );
  }
  return lines.join("\n");
}

function flag(argv, name) {
  const at = argv.indexOf(`--${name}`);
  return at === -1 ? undefined : argv[at + 1];
}

const readPage = (argv) => pageOf(readFileSync(flag(argv, "page") ?? PAGE_FILE, "utf8"));

function promptCommand(argv, set) {
  if (argv.includes("--judge")) return judgePrompt(set);
  const arm = flag(argv, "arm");
  const page = arm === "with" ? readPage(argv) : "";
  return answerPrompt(set, { arm, order: flag(argv, "order"), page });
}

function main(argv) {
  const [command] = argv;
  const set = JSON.parse(readFileSync(flag(argv, "set") ?? SET_FILE, "utf8"));
  if (command === "cases") {
    const n = flag(argv, "n");
    const plan = casesFor(set, n === undefined ? {} : { n: Number(n) });
    readPage(argv); // before a single arm is paid for, not after the arm without it has run
    console.log(JSON.stringify(plan));
    return 0;
  }
  if (command === "prompt") {
    console.log(promptCommand(argv, set));
    return 0;
  }
  if (command === "score") {
    const file = flag(argv, "results");
    if (!file) throw new Error("score needs --results <file>");
    const report = scoreReplay(set, JSON.parse(readFileSync(file, "utf8")));
    console.log(argv.includes("--json") ? JSON.stringify(report, null, 2) : summary(report));
    return 0;
  }
  throw new Error("usage: intent-replay.mjs cases|prompt|score (see the file's header)");
}

if (isMain(import.meta.url)) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    // Nothing printed is ever a score: a run that could not read its inputs says unknown.
    console.error(`intent-replay: ${error.message} — verdict UNKNOWN.`);
    process.exitCode = 2;
  }
}
