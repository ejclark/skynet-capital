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
import { safeKey } from "./model.mjs";

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
