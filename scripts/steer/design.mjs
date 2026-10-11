// STEER DESIGN ROUND — a critique round enters the page as decisions of kind "design" (#5056).
//
// The shape is the one the profile critique builder already wrote (#5037 round 1: the session
// scratchpad's img/manifest.json): one entry per question, `{ q, today: { phone, desk, source,
// caption }, options: [{ key, name, phone, desk, delta }] }`. The question's words ride on the same
// entry (round 1 kept them in a Python file beside it): `title`, `ask`, `rec` (the recommended
// option's key), `conf`, `wrong`, `saw[]`, `changes`, `topic`. Two wrappers are accepted:
//   - an object `{ issue, round, root?, questions: [entry…] }`, or
//   - a bare array of entries, with the issue and round passed as options.
// Image paths resolve against `root`, else the manifest's folder, else its parent (round 1's
// manifest sits in img/ and names its pictures `img/q1/…`). A picture that is named but missing is
// an error — a round that silently lost its Today shot is the failure this page exists to avoid.
import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { estimateMinutes, roundPath, safeKey, splitByPictures } from "./model.mjs";

/** A design round's questions from a manifest file, as page decisions (minutes added later). */
export function loadDesign(file, { issue, round } = {}) {
  const raw = JSON.parse(readFileSync(file, "utf8"));
  const wrap = Array.isArray(raw) ? { questions: raw } : raw;
  const n = Number(wrap.issue ?? issue);
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(
      "steer/design: no issue number — set `issue` in the manifest or pass --design-issue",
    );
  }
  if (!(Array.isArray(wrap.questions) && wrap.questions.length)) {
    throw new Error(`steer/design: ${file} holds no questions`);
  }
  const roots = [wrap.root, dirname(file), dirname(dirname(file))]
    .filter(Boolean)
    .map((r) => resolve(dirname(file), r));
  const at = (p) => {
    if (!p) return null;
    if (isAbsolute(p)) return checked(p);
    const hit = roots.map((r) => join(r, p)).find((c) => existsSync(c));
    if (!hit)
      throw new Error(`steer/design: picture not found: ${p} (looked under ${roots.join(", ")})`);
    return hit;
  };
  return designDecisions(wrap.questions, { issue: n, round: wrap.round ?? round ?? null, at });
}

/** Every `--design` value in argv: repeatable (`--design a.json --design b.json`), a comma list
 *  (`--design a.json,b.json`), or both. */
export function designFiles(argv) {
  const out = [];
  argv.forEach((a, i) => {
    if (a === "--design" && argv[i + 1] != null) out.push(...argv[i + 1].split(","));
  });
  return out.map((f) => f.trim()).filter(Boolean);
}

const namesIssue = (file) => {
  const raw = JSON.parse(readFileSync(file, "utf8"));
  return !Array.isArray(raw) && raw.issue != null;
};

/**
 * Several rounds on one page, keyed by issue: `{ [issue]: decisions }` (#5056 — every decision
 * gets pictures, so a page can carry one drawing per issue). Each manifest names its own `issue`;
 * `issue` (--design-issue) stands in only when exactly one manifest leaves it out, so two bare
 * manifests can never land on the same issue by accident. One issue, one manifest.
 */
export function loadDesigns(files, { issue, round } = {}) {
  const bare = files.filter((f) => !namesIssue(f));
  if (bare.length > 1) {
    throw new Error(
      `steer/design: ${bare.length} manifests name no issue (${bare.join(", ")}) — set \`issue\` in each; --design-issue covers one`,
    );
  }
  const out = {};
  for (const file of files) {
    const questions = loadDesign(file, { issue, round });
    const n = questions[0].issue;
    if (out[n])
      throw new Error(`steer/design: two manifests name #${n} — put its questions in one`);
    out[n] = questions;
  }
  return out;
}

function checked(p) {
  if (!existsSync(p)) throw new Error(`steer/design: picture not found: ${p}`);
  return p;
}

const pics = (o, alt, at) =>
  [
    o?.phone && { src: at(o.phone), alt: `${alt} at phone width`, size: "phone" },
    o?.desk && { src: at(o.desk), alt: `${alt} at desktop width`, size: "desk" },
  ].filter(Boolean);

/** Pure once `at` is: manifest entries → decisions. `at` maps a manifest path to a usable one. */
export function designDecisions(questions, { issue, round = null, at = (p) => p }) {
  return questions.map((q, i) => {
    const n = Number(q.q ?? i + 1);
    const options = (q.options ?? []).map((o) => ({
      key: safeKey(o.key),
      name: o.name ?? `Option ${o.key}`,
      delta: o.delta ?? "",
      recommended: q.rec != null && String(o.key) === String(q.rec),
      pictures: pics(o, `Option ${o.key}`, at),
    }));
    const rec = options.find((o) => o.recommended);
    const source = String(q.today?.source ?? "");
    return {
      key: safeKey(`${issue}-q${n}`),
      kind: "design",
      issue,
      isPr: false,
      round,
      q: n,
      topic: q.topic ?? q.id ?? null,
      title: q.title ?? `Question ${n}`,
      ask: q.ask ?? "",
      changes: q.changes ?? null,
      irreversible: false,
      default: null,
      recommendation: rec
        ? {
            key: rec.key,
            label: rec.name,
            confidence: q.conf ?? null,
            wrongIf: q.wrong ?? null,
            saw: q.saw ?? [],
          }
        : null,
      today: q.today
        ? {
            pictures: pics(q.today, "Today", at),
            caption: q.today.caption ?? "",
            real: !source.startsWith("mockup"),
          }
        : null,
      options,
    };
  });
}

// ── a design round on its own page (#5143) ─────────────────────────────────────────────────────
//
// A redesign session (docs/process/REDESIGN.md) asks one screen's questions on a page of its own:
// the shapes it drew, Eric's pinned comments and one pick, then Done. The steering page's other
// sections — what shipped, the queue, the 14-day strip — belong to the twice-a-day page and would
// bury the one question, so this page carries none of them. Gather builds it with `--design-only`.
//
// No Needs-you door here: that door governs what the shared steering page asks, and this page asks
// only what its own session drew for the screen Eric started. Everything after gather is the same
// machinery: build.mjs renders it, the page saves to `tp/<id>/…`, Done sends "Done with steering
// round <id>" to the watching session, and readback.mjs turns the answers into issue comments.

/** The page's name when the session gives none: a name, not a summary (two words). */
export const DESIGN_TITLE = "Redesign round";
/** What skipping a question does on a round page: nothing is built, and the next round asks again. */
export const DESIGN_SKIP =
  "If you skip: nothing is built from it, and the next round asks it again.";

/** `design-<issue>[-<issue>…][-r<round>]`: the round's store id when the session names none. */
export function designRoundId(issues, round) {
  const r = round == null || round === "" ? "" : `-r${safeKey(round)}`;
  return `design-${issues.join("-")}${r}`;
}

/**
 * The tp.json of a page that holds only design decisions: `design` is `loadDesigns()`'s
 * `{ [issue]: decisions }`. Pure. `id` (from `--tp`) may be any id the store accepts; a bad one
 * throws here, before anything is written. Nothing is asked without a picture: a question with
 * none is named as being drawn, the same rule the steering page keeps.
 */
export function designRound(design, { id, title, now, repo = "ejclark/skynet-capital" } = {}) {
  const issues = Object.keys(design)
    .map(Number)
    .sort((a, b) => a - b);
  if (!issues.length) {
    throw new Error("steer/design: a design-only page needs at least one --design manifest");
  }
  const all = issues.flatMap((n) =>
    design[n].map((q) => ({
      ...q,
      link: `https://github.com/${repo}/issues/${n}`,
      cls: null,
      minutes: estimateMinutes(q),
      skip: DESIGN_SKIP,
    })),
  );
  const { pictured, needsPictures } = splitByPictures(all);
  const round = all.find((d) => d.round != null)?.round ?? null;
  const roundId = id || designRoundId(issues, round);
  roundPath(roundId); // the store's own grammar: refuse an id it would not file
  const used = pictured.reduce((sum, d) => sum + d.minutes, 0);
  return {
    version: 1,
    designOnly: true,
    id: roundId,
    title: title || DESIGN_TITLE,
    round,
    issues,
    generatedAt: now ?? null,
    repo,
    budget: { minutes: used, used, shown: pictured.length, deferred: 0 },
    decisions: pictured,
    deferred: [],
    needsPictures,
    unstated: { count: 0, numbers: [] },
  };
}
