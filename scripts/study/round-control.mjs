// A CONTROL ROUND (#4943) — the main round's frozen tasks, run again against another pinned build.
//
//   node scripts/study/round.mjs --pin <other pin> --out <fresh dir> --sealed <dir> \
//        --frozen-from <main round dir> --control negative|positive --expect <expect file> \
//        [--runs N] [--experts N]
//
// Negative = the fixed build: it must not report what the fixes removed. Positive = a build with
// planted defects: they must be found. Either is only a control if it asks the SAME questions as
// the main round, so nothing here authors anything:
//   3 framer, 4 tasks   NOT run — the main round's tasks.json, per-task files and frozen.json are
//                       copied in, and refused unless tasks.json still hashes to its freeze
//   1 cards             rebuilt as usual, and refused unless each hashes to the main round's card
//   8 words, 9 audit    skipped — they judge the copy and the member cards, not the build's behaviour
//   runs, experts       1 each by default (--runs, --experts override)
// The census, facts sheet and harvest are the control pin's own (the build differs, so must they);
// the member × world × viewport matrix, the thin cut and the world are the main round's. The
// findings and classes keep the round contract, and <out>/control.json (round-contract.mjs →
// controlRecord) says what this control is, for grade.mjs --negative / --positive.
// --expect states each key id the control is about, with the MECHANISM beside it — what the fix
// removed, or the defect planted (`A3 — a filter tap jumps the page to the top`). The mechanism is
// for the matchers, who are aware: round one's fixed build "still reported" two items through a
// different mechanism at the same place (#5099). A negative control is refused without one for
// every id, so it is stated before the round, never after its findings. Only the ids reach
// control.json and round.json, and no blind role reads the file.

import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { controlRecord, FILES, SESSIONS } from "./round-contract.mjs";
import { readList } from "./round-files.mjs";
import { censusPlan, selectMatrix } from "./round-plan.mjs";

const sha256 = (v) => createHash("sha256").update(v).digest("hex");
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const readIf = (path) => (existsSync(path) ? readJson(path) : null);

/**
 * Why a control round may not run from this main round — [] when it may. `source` is the main
 * round's round.json (null when absent), `frozen` its frozen.json, `ranFrozen` the freeze its
 * sessions were planned on (its log), and `profileSha`, `stub`, `sealed` this run's own.
 */
export function sourceProblems({ source, frozen, ranFrozen = null, profileSha, stub, sealed }) {
  if (!source) return ["the --frozen-from dir holds no round.json — not a round"];
  const out = [];
  if (source.control) out.push("the --frozen-from round is itself a control round");
  if (source.profileSha !== profileSha) {
    out.push("the area config is not the one the --frozen-from round ran (its sha256 differs)");
  }
  // A stub-authored task set re-asked with sealed calls (or the reverse) is not the same question.
  if (Boolean(source.stub) !== Boolean(stub)) {
    out.push(
      `the --frozen-from round was ${source.stub ? "" : "not "}a stub round and this one is${stub ? "" : " not"}`,
    );
  }
  if ((source.sealed ?? null) !== (sealed ?? null)) {
    out.push("the --frozen-from round ran under another --sealed answer key");
  }
  const sha = frozen?.sha256 ?? "";
  if (!/^[0-9a-f]{64}$/.test(sha)) {
    out.push("the --frozen-from round never froze its tasks (no frozen.json)");
  } else if (ranFrozen !== sha) {
    out.push(
      ranFrozen
        ? `the --frozen-from round's sessions ran tasks frozen as ${ranFrozen.slice(0, 12)}, not its frozen.json's ${sha.slice(0, 12)} — re-frozen since`
        : "the --frozen-from round never ran its sessions on its frozen tasks",
    );
  }
  return out;
}

/** The member cards whose sha256 differs from the main round's, or is missing on either side. */
export function cardMismatches(source, now) {
  const names = [...new Set([...Object.keys(source ?? {}), ...Object.keys(now ?? {})])].sort();
  return names.filter((m) => !source?.[m] || source[m] !== now?.[m]);
}

/**
 * The frozen tasks whose fact this build's facts sheet serves with another answer, or not at all.
 * Reported, never refused: the build is meant to differ, and the oracle grades each session on
 * the page it actually reads.
 */
export function factDrift(tasks, facts) {
  const out = [];
  for (const t of tasks) {
    const f = facts.find((x) => x.id === t.fact && x.world === t.world);
    if (!f) out.push({ task: t.id, fact: t.fact, drift: "missing" });
    else if (JSON.stringify(f.answer) !== JSON.stringify(t.answer)) {
      out.push({ task: t.id, fact: t.fact, drift: "answer" });
    }
  }
  return out;
}

const EXPECT_LINE = /^([A-Za-z]+\d+)(?:\s*[—–:-]\s*(.*))?$/;

/** One --expect item as {id, mechanism}: `A3`, `A3 — mechanism` or {id, mechanism}; null if neither. */
function expectEntry(x) {
  if (x && typeof x === "object") {
    const id = String(x.id ?? "").trim();
    const mechanism = String(x.mechanism ?? "").trim();
    return EXPECT_LINE.test(id) ? { id, mechanism: mechanism || null } : null;
  }
  const m = EXPECT_LINE.exec(String(x).trim());
  return m ? { id: m[1], mechanism: m[2]?.trim() || null } : null;
}

/**
 * --expect, read (a JSON array, or one item a line): [{id, mechanism}] — the first of an id
 * named twice. Throws when it names no id, or an item does not start with one.
 */
export function expectEntries(list) {
  const items = list.filter((x) => (typeof x === "object" ? x : String(x).trim()));
  if (items.length === 0) throw new Error("--expect names no key ids");
  const bad = items.filter((x) => !expectEntry(x)).map((x) => JSON.stringify(x));
  if (bad.length > 0) {
    throw new Error(
      `each --expect item starts with a key id (A3, or A3 — the mechanism), not: ${bad.join(", ")}`,
    );
  }
  const out = [];
  for (const e of items.map(expectEntry)) if (!out.some((o) => o.id === e.id)) out.push(e);
  return out;
}

/** The key ids from --expect — all a round records of it. */
export const expectIds = (list) => expectEntries(list).map((e) => e.id);

/** Why --expect cannot run this kind of control — [] when it can. */
export function expectProblems(kind, entries) {
  if (kind !== "negative") return [];
  const bare = entries.filter((e) => !e.mechanism).map((e) => e.id);
  return bare.length
    ? [
        `--expect names no mechanism for ${bare.join(", ")} — a negative control states what each fix removed`,
      ]
    : [];
}

/** A round's log events, in order; a torn line (a crash mid-append) is skipped, not fatal. */
function logEvents(round) {
  const log = join(round, "log.jsonl");
  if (!existsSync(log)) return [];
  return readFileSync(log, "utf8")
    .split("\n")
    .filter(Boolean)
    .flatMap((l) => {
      try {
        return [JSON.parse(l)];
      } catch {
        return [];
      }
    });
}

/** A round's pin commit, from its own preflight log line (the pin dir may have moved on since). */
function loggedPin(round) {
  const pins = logEvents(round).filter((l) => l.step === "0-preflight" && l.pin);
  return pins.at(-1)?.pin ?? null;
}

/** The freeze a round's sessions were last planned on, from its log; null when they never ran. */
function ranFrozen(round) {
  const plans = logEvents(round).filter((l) => l.step === SESSIONS && l.event === "plan");
  return plans.at(-1)?.frozen ?? null;
}

/**
 * Before the mode is held: read the main round, refuse what cannot be a control of it, and take
 * its thin cut and world — so the matrix and the censuses are planned exactly as it planned them.
 */
export function adoptSource(ctx) {
  const dir = resolve(ctx.opts.frozenFrom);
  if (dir === ctx.out) throw new Error("--frozen-from is this round's own --out");
  const source = readIf(join(dir, "round.json"));
  const frozen = readIf(join(dir, FILES.frozen));
  const profileSha = sha256(readFileSync(resolve(ctx.opts.profile)));
  const problems = sourceProblems({
    source,
    frozen,
    ranFrozen: ranFrozen(dir),
    profileSha,
    stub: ctx.stub,
    sealed: ctx.sealed,
  });
  if (problems.length > 0) throw new Error(`refusing the control — ${problems.join("; ")}`);
  const expected = readList(resolve(ctx.opts.expect));
  const unstated = expectProblems(ctx.opts.control, expectEntries(expected));
  if (unstated.length > 0) throw new Error(`refusing the control — ${unstated.join("; ")}`);
  Object.assign(ctx.opts, {
    frozenFrom: dir,
    thin: Boolean(source.thin),
    onlyWorld: source.onlyWorld ?? undefined,
    sourceFrozen: frozen.sha256,
    expectIds: expectIds(expected),
  });
  ctx.matrix = selectMatrix(ctx.p, ctx.opts);
  ctx.censuses = censusPlan(ctx.p, ctx.opts);
  ctx.source = { dir, frozen: frozen.sha256, pin: loggedPin(dir) };
  ctx.log("round", "control", {
    kind: ctx.opts.control,
    from: dir,
    frozen: frozen.sha256,
    thin: ctx.opts.thin,
    expect: ctx.opts.expectIds.length,
  });
}

/** Step 1, control round: every card must hash to the main round's — the same members, verbatim. */
export function checkCards(ctx, hashes) {
  const source = readIf(join(ctx.source.dir, "1-cards", "hashes.json"));
  const off = cardMismatches(source, hashes);
  if (off.length > 0) {
    throw new Error(`member cards differ from the --frozen-from round's: ${off.join(", ")}`);
  }
  ctx.log("1-cards", "cards-match", { members: Object.keys(hashes).length });
}

/**
 * Step 4, control round: the main round's frozen tasks, copied byte for byte and re-verified —
 * tasks.json against its frozen.json, each per-task file against its entry. Nothing is authored.
 */
export function adoptTasks(ctx) {
  const step = "4-tasks";
  const from = join(ctx.source.dir, step);
  const text = readFileSync(join(from, "tasks.json"), "utf8");
  const frozen = readJson(join(ctx.source.dir, FILES.frozen));
  if (sha256(text) !== frozen.sha256 || frozen.sha256 !== ctx.source.frozen) {
    throw new Error(
      `the --frozen-from round's tasks.json no longer hashes to its freeze (${frozen.sha256.slice(0, 12)})`,
    );
  }
  const tasks = JSON.parse(text);
  const dir = ctx.dir(step);
  mkdirSync(join(dir, "tasks"), { recursive: true });
  for (const t of tasks) {
    const file = join(from, "tasks", `${t.id}.json`);
    if (!(existsSync(file) && JSON.stringify(readJson(file)) === JSON.stringify(t))) {
      throw new Error(`the --frozen-from round's tasks/${t.id}.json is not its frozen task`);
    }
    copyFileSync(file, join(dir, "tasks", `${t.id}.json`));
  }
  copyFileSync(join(from, "tasks.json"), join(dir, "tasks.json"));
  copyFileSync(join(ctx.source.dir, FILES.frozen), join(ctx.out, FILES.frozen));
  const { facts } = readJson(join(ctx.out, "0-preflight", "facts.json"));
  const drift = factDrift(tasks, facts);
  ctx.log(step, "adopted", { tasks: tasks.length, sha256: frozen.sha256, from: ctx.source.dir });
  for (const d of drift) ctx.log(step, "fact-drift", d);
  return { tasks: tasks.length, sha256: frozen.sha256, adoptedFrom: ctx.source.dir, drift };
}

/** Step 10, control round: control.json, beside the findings it describes. */
export function writeControl(ctx) {
  const record = controlRecord({
    kind: ctx.opts.control,
    source: ctx.source.dir,
    frozen: ctx.source.frozen,
    // Both pins from their round's own preflight log line, taken the same way.
    pin: loggedPin(ctx.out),
    sourcePin: ctx.source.pin,
    expect: ctx.opts.expectIds,
  });
  writeFileSync(join(ctx.out, FILES.control), `${JSON.stringify(record, null, 1)}\n`);
  if (record.pin && record.pin === record.sourcePin) {
    // Allowed here (a stub round may), refused by the grader (controlProblems).
    ctx.log("10-collect", "same-build", { note: `the control ran the main round's own pin` });
  }
  ctx.log("10-collect", "control", { kind: record.kind, pin: record.pin, from: record.source });
  return record;
}
