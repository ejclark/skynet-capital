// A study round's review steps (#4943): the analysts (6), the experts (7), the words pass (8), the
// member-type audit (9) and the collection of every finding (10). Each blind role reads only the
// packet built here from earlier steps' files; the decisions are round-plan.mjs's, the shapes
// round-findings.mjs's.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import {
  collectFindings,
  fromAnalyst,
  fromExpert,
  fromInstruments,
  fromWords,
  stripClasses,
} from "./round-findings.mjs";
import { batchCensus, batchFrames, capFrames, keyFrames } from "./round-frames.mjs";
import {
  analystText,
  auditText,
  expertBatchText,
  expertConsolidationText,
  wordsText,
} from "./round-messages.mjs";
import { readCards } from "./round-steps.mjs";
import { readSchema, userMessage } from "./sealed.mjs";

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const writeJson = (path, v) => writeFileSync(path, `${JSON.stringify(v, null, 1)}\n`);
const readLines = (path) =>
  existsSync(path)
    ? readFileSync(path, "utf8")
        .split("\n")
        .filter((l) => l.trim())
        .map((l) => JSON.parse(l))
    : [];
const members = (ctx) => [...new Set(ctx.matrix.map((r) => r.member))];

/** One session's files, as the analyst step reads them. */
function readSession(ctx, s) {
  const dir = join(ctx.out, "5-sessions", s.dir);
  const task = readJson(join(ctx.out, "4-tasks", "tasks", `${s.task}.json`));
  return {
    ...s,
    dir,
    scenario: task.scenario,
    start: task.start,
    summary: readJson(join(dir, "summary.json")),
    turns: readLines(join(dir, "turns.jsonl")),
    trace: readLines(join(dir, "trace.jsonl")),
  };
}

/** Step 6: one analyst per member, over that member's sessions and key frames. */
export async function analysts(ctx) {
  const step = "6-analysts";
  const dir = ctx.dir(step);
  const plan = readJson(join(ctx.out, "5-sessions", "sessions.json"));
  const call = ctx.call(step);
  const counts = {};
  for (const member of members(ctx)) {
    const mine = plan.filter((s) => s.member === member).map((s) => readSession(ctx, s));
    const withFrames = mine.map((s, i) => ({
      ...s,
      label: `S${i + 1}`,
      frames: keyFrames({
        turns: s.turns,
        trace: s.trace,
        opening: join(s.dir, "frames", "000.jpg"),
        start: s.start,
      }),
    }));
    const { sessions, dropped } = capFrames(withFrames);
    const frames = {};
    const images = [];
    for (const s of sessions) {
      for (const f of s.frames) {
        f.label = `F${images.length + 1}`;
        frames[f.label] = { path: ctx.rel(f.path), route: f.route, viewport: s.viewport };
        images.push({
          label: `[${f.label}] ${s.label}, ${f.why.join(", ")}`,
          b64: await ctx.half(f.path),
        });
      }
    }
    const answer = await call({
      role: "analyst",
      rolePath: join(ctx.roles, "analyst.md"),
      schema: readSchema("analyst"),
      message: userMessage(
        analystText({ card: readCards(ctx, [member])[member], sessions, dropped }),
        images,
      ),
      timeoutMs: 600_000,
    });
    const index = sessions.map((s) => ({
      label: s.label,
      session: s.dir.slice(ctx.out.length + 1),
    }));
    writeJson(join(dir, `${member}.json`), { member, answer, frames, sessions: index, dropped });
    counts[member] = {
      sessions: sessions.length,
      frames: images.length,
      dropped,
      findings: answer.findings.length,
    };
    ctx.log(step, "analyst", { member, ...counts[member] });
  }
  return { members: counts };
}

/** The census batches each expert reviews; the first expert also gets the hand-off pages. */
function expertBatches(ctx) {
  const read = (c) => {
    const dir = join(ctx.out, "0-preflight", c.key);
    return { source: c.key, dir, entries: readJson(join(dir, "census.json")).controls };
  };
  const pick = (tag) => ctx.censuses.filter((c) => c.for.includes(tag)).map(read);
  const dirOf = Object.fromEntries(
    [...pick("experts"), ...pick("handoff")].map((c) => [c.source, c.dir]),
  );
  return { main: batchCensus(pick("experts")), handoff: batchCensus(pick("handoff")), dirOf };
}

/** Step 7: N independent experts, the census verbatim in batches, then one consolidation each. */
export async function experts(ctx) {
  const step = "7-experts";
  const dir = ctx.dir(step);
  const cards = readCards(ctx, members(ctx));
  const { main, handoff, dirOf } = expertBatches(ctx);
  const n = ctx.opts.thin ? 1 : ctx.p.experts;
  const call = ctx.call(step);
  const out = {};
  for (let k = 1; k <= n; k++) {
    const batches = k === 1 ? [...main, ...handoff] : main;
    const batchFindings = [];
    const impressions = [];
    const index = {};
    for (const [b, batch] of batches.entries()) {
      const frames = batchFrames(batch.entries);
      const images = [];
      for (const f of frames) {
        images.push({
          label: `[${f.label}]`,
          b64: await ctx.half(join(dirOf[batch.source], f.rel)),
        });
      }
      const answer = await call({
        role: "expert",
        rolePath: join(ctx.roles, "expert.md"),
        schema: readSchema("expert"),
        message: userMessage(
          expertBatchText({ cards, batch, frames, n: b + 1, of: batches.length }),
          images,
        ),
        timeoutMs: 600_000,
      });
      impressions.push(...answer.first_impression);
      for (const [i, finding] of answer.findings.entries()) {
        const id = `B${b + 1}.${i + 1}`;
        const cited = finding.frames
          .map((label) => frames.find((f) => f.label === label))
          .filter(Boolean)
          .map((f) => ({
            path: ctx.rel(join(dirOf[batch.source], f.rel)),
            route: batch.route,
            viewport: batch.viewport,
          }));
        index[id] = { frames: cited, source: batch.source };
        batchFindings.push({ id, finding });
      }
      ctx.log(step, "batch", {
        expert: k,
        batch: b + 1,
        of: batches.length,
        source: batch.source,
        route: batch.route,
        viewport: batch.viewport,
        controls: batch.entries.length,
        frames: images.length,
        findings: answer.findings.length,
      });
    }
    const consolidated = await call({
      role: "expert-consolidation",
      rolePath: join(ctx.roles, "expert.md"),
      schema: readSchema("expert-consolidation"),
      message: userMessage(expertConsolidationText({ cards, batchFindings, impressions })),
      timeoutMs: 600_000,
    });
    writeJson(join(dir, `expert-${k}.json`), {
      k,
      batches: batches.length,
      batchFindings,
      index,
      answer: consolidated,
    });
    out[`expert-${k}`] = { batches: batches.length, findings: consolidated.findings.length };
    ctx.log(step, "consolidated", { expert: k, ...out[`expert-${k}`] });
  }
  return out;
}

/** Step 8: the words pass over the harvested strings. */
export async function words(ctx) {
  const step = "8-words";
  const dir = ctx.dir(step);
  if (ctx.opts.thin) return { skipped: "thin" };
  const strings = readJson(join(ctx.out, "0-preflight", "harvest", "strings.json"));
  const answer = await ctx.call(step)({
    role: "words",
    rolePath: join(ctx.roles, "words.md"),
    schema: readSchema("words"),
    message: userMessage(wordsText({ cards: readCards(ctx, members(ctx)), strings })),
    timeoutMs: 600_000,
  });
  writeJson(join(dir, "words.json"), answer);
  return { findings: answer.findings.length };
}

/** Step 9: who is missing from the member cards. */
export async function audit(ctx) {
  const step = "9-member-types";
  const dir = ctx.dir(step);
  if (ctx.opts.thin) return { skipped: "thin" };
  const answer = await ctx.call(step)({
    role: "member-type-audit",
    rolePath: join(ctx.roles, "member-type-audit.md"),
    schema: readSchema("member-type-audit"),
    message: userMessage(auditText({ cards: readCards(ctx, members(ctx)) })),
  });
  writeJson(join(dir, "proposals.json"), answer);
  return { proposals: answer.proposals.length };
}

const routeOf = (snap) => (snap ? `${snap.pathname}${snap.search ?? ""}` : null);

/** The recorder's and the census's own findings, with where each fired. */
function instrumentRaw(ctx) {
  const raw = [];
  const plan = readJson(join(ctx.out, "5-sessions", "sessions.json"));
  for (const s of plan) {
    const dir = join(ctx.out, "5-sessions", s.dir);
    for (const r of readLines(join(dir, "trace.jsonl"))) {
      for (const f of r.findings ?? []) {
        raw.push({
          ...f,
          source: "recorder",
          route: routeOf(r.before),
          viewport: s.viewport,
          frame: r.frame ? ctx.rel(r.frame) : null,
        });
      }
    }
  }
  for (const c of ctx.censuses.filter(
    (x) => x.for.includes("experts") || x.for.includes("handoff"),
  )) {
    const cdir = join(ctx.out, "0-preflight", c.key);
    for (const e of readJson(join(cdir, "census.json")).controls) {
      const frame = e.frames?.after ?? e.frames?.before;
      for (const f of e.findings ?? []) {
        raw.push({
          ...f,
          source: "census",
          route: e.route,
          viewport: e.viewport,
          frame: frame ? ctx.rel(join(cdir, frame)) : null,
        });
      }
    }
  }
  return raw;
}

/** Step 10: every finding with a stable id; classes kept apart. */
export function collect(ctx) {
  const step = "10-collect";
  ctx.dir(step);
  const groups = [];
  for (const member of members(ctx)) {
    const a = readJson(join(ctx.out, "6-analysts", `${member}.json`));
    groups.push(fromAnalyst({ member, answer: a.answer, frames: a.frames }));
  }
  const n = ctx.opts.thin ? 1 : ctx.p.experts;
  for (let k = 1; k <= n; k++) {
    const e = readJson(join(ctx.out, "7-experts", `expert-${k}.json`));
    groups.push(fromExpert({ k, answer: e.answer, batch: e.index }));
  }
  const wordsFile = join(ctx.out, "8-words", "words.json");
  if (existsSync(wordsFile)) {
    const strings = readJson(join(ctx.out, "0-preflight", "harvest", "strings.json"));
    groups.push(fromWords({ answer: readJson(wordsFile), strings }));
  }
  groups.push(fromInstruments(instrumentRaw(ctx)));
  const { findings, classes } = collectFindings(groups);
  const lines = (list) => list.map((f) => JSON.stringify(f)).join("\n");
  writeFileSync(join(ctx.out, "findings.jsonl"), `${lines(findings)}\n`);
  writeFileSync(join(ctx.out, "findings-unlabelled.jsonl"), `${lines(stripClasses(findings))}\n`);
  writeJson(join(ctx.out, "classes.json"), classes);
  const byClass = {};
  for (const c of Object.values(classes)) byClass[c] = (byClass[c] ?? 0) + 1;
  ctx.log(step, "findings", { total: findings.length, byClass });
  return {
    total: findings.length,
    byClass,
    dir: relative(ctx.out, dirname(join(ctx.out, "findings.jsonl"))) || ".",
  };
}
