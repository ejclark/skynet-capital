// STEER DESIGN ROUND — a critique round enters the page as decisions of kind "design" (#5056).
//
// The shape is the one the profile critique builder already wrote (#5037 round 1: the session
// scratchpad's img/manifest.json): one entry per question, `{ q, today: { phone, desk, source,
// caption }, options: [{ key, name, phone, desk, delta }] }`. An option, or Today, may carry
// `pins` / `pinsDesk`: the pins its frame was drawn with (pins.mjs). The question's words ride on the same
// entry (round 1 kept them in a Python file beside it): `title`, `ask`, `rec` (the recommended
// option's key), `conf`, `wrong`, `saw[]`, `changes`, `topic`. Three more ride through to the page
// (Eric, 2026-10-14): `opening` on a problems question (his marks on clean frames before Claude's
// problems, marks.mjs), `pin` on a problems option (its pin number on Today's frame, in place of
// pictures of its own), and `scope` with each option's `serves` (scope.mjs). And `focus` (Eric,
// 2026-10-14: narrow a round to the section under the microscope): a section's label, or a box per
// frame — resolved here on every picture into `focus: { x, y, w, h, label }` (focus.mjs), so the
// page opens each frame cropped to it. Two wrappers are accepted:
//   - an object `{ issue, round, root?, questions: [entry…] }`, or
//   - a bare array of entries, with the issue and round passed as options.
// Image paths resolve against `root`, else the manifest's folder, else its parent (round 1's
// manifest sits in img/ and names its pictures `img/q1/…`). A picture that is named but missing is
// an error — a round that silently lost its Today shot is the failure this page exists to avoid.
import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { focusBoxProblems, focusFor, imageRatio } from "./focus.mjs";
import { estimateMinutes, roundPath, safeKey, splitByPictures } from "./model.mjs";
import { holderPins } from "./pins.mjs";
import { scopeOf, servesOf } from "./scope.mjs";

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
  const find = (p) =>
    isAbsolute(p) ? (existsSync(p) ? p : null) : roots.map((r) => join(r, p)).find(existsSync);
  const at = (p) => {
    if (!p) return null;
    if (isAbsolute(p)) return checked(p);
    const hit = find(p);
    if (!hit)
      throw new Error(`steer/design: picture not found: ${p} (looked under ${roots.join(", ")})`);
    return hit;
  };
  // A pins value may name the file pin.mjs drew from, so the frame and the page read one copy.
  // Null when it isn't there: pins.mjs names the file in its refusal.
  const pinsFrom = (p) => {
    const hit = find(p);
    return hit ? JSON.parse(readFileSync(hit, "utf8")) : null;
  };
  // A picture's proportions, read from its header, so a focused crop is sized before it loads;
  // null when it can't be read — the page script measures it then (focus-client.js).
  const ratioOf = (p) => {
    try {
      return imageRatio(readFileSync(p));
    } catch {
      return null;
    }
  };
  return designDecisions(wrap.questions, {
    issue: n,
    round: wrap.round ?? round ?? null,
    at,
    pinsFrom,
    ratioOf,
  });
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

const WIDTH = { phone: "phone width", desk: "desktop width" };

/** A holder's pictures (Today, or an option), phone first, each carrying the pins drawn on it
 *  and, when the manifest names them, its sections (frame-sections.mjs: where each named part of
 *  the screen sits, so the read-back can name the part a mark landed on). */
const pics = (o, alt, at, pins = {}, sections = {}, focus = NO_FOCUS) =>
  ["phone", "desk"]
    .filter((size) => o?.[size])
    .map((size) =>
      withFocus(
        {
          src: at(o[size]),
          alt: `${alt} at ${WIDTH[size]}`,
          size,
          ...(pins[size]?.length ? { pins: pins[size] } : {}),
          ...(sections[size]?.length ? { sections: sections[size] } : {}),
        },
        focus,
      ),
    );

/** No `focus` on the question: pictures as they always were. */
const NO_FOCUS = { spec: undefined, ratioOf: undefined };

/** A picture with the round's focus resolved on it (focus.mjs) — `focus`, and `ratio` when its
 *  file can be read — or as it was, when the question has none or this frame doesn't hold it. */
function withFocus(pic, { spec, ratioOf }) {
  const focus = spec === undefined ? null : focusFor(spec, pic);
  if (!focus) return pic;
  const ratio = ratioOf?.(pic.src);
  return { ...pic, focus, ...(typeof ratio === "number" && ratio > 0 ? { ratio } : {}) };
}

/** A question's `focus`, checked: a section's label, or a box per frame. A malformed box throws,
 *  as a malformed pin does — a crop drawn from it would hide the wrong part of the screen. */
function focusSpec(q, n, ratioOf) {
  const spec = q.focus;
  if (spec === undefined) return NO_FOCUS;
  if (typeof spec === "string" && spec.trim()) return { spec: spec.trim(), ratioOf };
  const ok = spec && typeof spec === "object" && !Array.isArray(spec);
  const problems = ok
    ? Object.entries(spec).flatMap(([k, box]) =>
        ["phone", "desk"].includes(k)
          ? focusBoxProblems(box, `q${n} focus ${k}`)
          : [`q${n} focus: "${k}" isn't a frame — "phone" or "desk"`],
      )
    : [`q${n}: "focus" is a section's label, or { "phone": [x, y, w, h], "desk": [...] }`];
  if (problems.length) throw new Error(`steer/design: ${problems.join("\n")}`);
  return { spec, ratioOf };
}

/** A holder's sections by frame: `sections` (phone) and `sectionsDesk`, each the list itself or
 *  the path of the `.sections.json` the shoot script wrote beside the frame. A file that isn't
 *  there gives none — sections only sharpen the read-back, so they never refuse a round. */
function sectionsOf(holder, readJson) {
  const out = {};
  for (const [field, size] of [
    ["sections", "phone"],
    ["sectionsDesk", "desk"],
  ]) {
    let v = holder?.[field];
    if (typeof v === "string") {
      try {
        v = readJson ? readJson(v) : null;
      } catch {
        v = null;
      }
    }
    if (Array.isArray(v)) out[size] = v;
  }
  return out;
}

/** Every holder's pins by frame, or a throw naming each pin the page couldn't place (pins.mjs). */
function pinsOf(q, n, pinsFrom) {
  const problems = [];
  const read = (holder, where) => {
    const got = holderPins(holder, where, pinsFrom);
    problems.push(...got.problems);
    return got.byFrame;
  };
  const today = read(q.today, `q${n} today`);
  const options = (q.options ?? []).map((o) => read(o, `q${n} option ${o.key}`));
  if (Object.keys(today).length && (q.options ?? []).some((o) => safeKey(o.key) === "today"))
    problems.push(`q${n}: an option keyed "today" can't share pin ids with Today's frame`);
  if (problems.length) throw new Error(`steer/design: ${problems.join("\n")}`);
  return { today, options };
}

/**
 * What a question asks. `design` (the default) shows shapes, and a pick is a build; `problems`
 * (round 0, docs/process/REDESIGN.md) shows the problems pinned on today, and a pick only chooses
 * what the next round draws — the page asks "Fix this first" and the read-back files nothing.
 */
export const QUESTION_KINDS = ["design", "problems"];

function questionKind(q, n) {
  const kind = q.kind ?? "design";
  if (!QUESTION_KINDS.includes(kind)) {
    throw new Error(
      `steer/design: q${n}: "kind" is "design" (the default) or "problems", not ${JSON.stringify(q.kind)}`,
    );
  }
  return kind;
}

/** One manifest option as the page holds it, its pictures carrying the pins drawn on them. */
function optionOf(o, q, at, pins, readJson, focus) {
  return {
    key: safeKey(o.key),
    name: o.name ?? `Option ${o.key}`,
    delta: o.delta ?? "",
    recommended: q.rec != null && String(o.key) === String(q.rec),
    pictures: pics(o, `Option ${o.key}`, at, pins, sectionsOf(o, readJson), focus),
    // One frame for every problem: the option names its pin on Today's frame instead of carrying
    // pictures of its own (render.mjs draws it as a compact row).
    ...(Number.isInteger(o.pin) ? { pin: o.pin } : {}),
    ...(servesOf(o.serves) ? { serves: servesOf(o.serves) } : {}),
  };
}

/** Today as the page holds it: its pictures with their pins, and — for a round that opens on clean
 *  frames (marks.mjs) — `clean`, the same frames before pin.mjs drew on them, so his first look
 *  carries none of Claude's badges. */
function todayOf(today, source, at, pins, readJson, focus) {
  if (!today) return null;
  // The clean frames are the same screen before pin.mjs drew on it, so they share its sections.
  const sections = sectionsOf(today, readJson);
  return {
    pictures: pics(today, "Today", at, pins, sections, focus),
    ...(today.clean
      ? { clean: pics(today.clean, "Today, before any pin", at, {}, sections, focus) }
      : {}),
    caption: today.caption ?? "",
    real: !source.startsWith("mockup"),
  };
}

/** How a question opens and what it is sized by: `opening` (his marks on clean frames first,
 *  Claude's problems folded away until he asks — marks.mjs) and `scope` (scope.mjs). */
function stages(q, problems) {
  const scope = scopeOf(q.scope);
  return {
    ...(problems && q.opening === true ? { opening: true } : {}),
    ...(scope ? { scope } : {}),
  };
}

/** Pure once `at`, `pinsFrom` and `ratioOf` are: manifest entries → decisions. `at` maps a
 *  manifest path to a usable one; `pinsFrom` reads a pins (or sections) file a manifest names;
 *  `ratioOf` reads a picture's height ÷ width, for a question with a focus (loadDesign passes all
 *  three). A problems question stays a design decision (pictures, minutes, the store) and carries
 *  `problems: true`, which changes only its words and its read-back. */
export function designDecisions(
  questions,
  { issue, round = null, at = (p) => p, pinsFrom, ratioOf },
) {
  return questions.map((q, i) => {
    const n = Number(q.q ?? i + 1);
    const problems = questionKind(q, n) === "problems";
    const pins = pinsOf(q, n, pinsFrom);
    const focus = focusSpec(q, n, ratioOf);
    const options = (q.options ?? []).map((o, j) =>
      optionOf(o, q, at, pins.options[j], pinsFrom, focus),
    );
    const rec = options.find((o) => o.recommended);
    const source = String(q.today?.source ?? "");
    return {
      key: safeKey(`${issue}-q${n}`),
      kind: "design",
      ...(problems ? { problems: true } : {}),
      ...stages(q, problems),
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
      today: todayOf(q.today, source, at, pins.today, pinsFrom, focus),
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
  const rounds = [...new Set(all.filter((d) => d.round != null).map((d) => String(d.round)))];
  if (rounds.length > 1) {
    throw new Error(
      `steer/design: one page holds one round — the manifests name rounds ${rounds.join(", ")}`,
    );
  }
  // The page's intro and verbs follow what it asks: a round-0 page picks a problem, a later one a
  // shape. Mixing them would put one intro over two meanings.
  const asks = new Set(all.map((d) => Boolean(d.problems)));
  if (asks.size > 1) {
    throw new Error(
      "steer/design: one page asks which problem to fix first, or shows shapes — not both; " +
        'round 0 sets "kind": "problems" on every question',
    );
  }
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
