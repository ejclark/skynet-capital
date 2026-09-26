// The input contract of `./mermaid-pairs.mjs`: the pairs-file schema and the CLI flags, each
// checked with a named error per problem. Nothing is rendered from a file that fails here — the
// "degrade honestly" rule: a missing field is a line on stderr, never a blank frame.
//
//   { "pairs": [ { "id", "title", "caption", "layout"?,
//                  "before": { "kind": "mermaid"|"markdown", "source", "label"? },
//                  "after":  { … } } ] }

/** docs/PICTURES.md's ceiling for a committed frame, in KB. */
const BUDGET_KB = 100;
const LAYOUTS = ["auto", "side", "stacked"];
export const MODES = { light: ["light"], dark: ["dark"], both: ["light", "dark"] };

const KINDS = ["mermaid", "markdown"];
const PAIR_KEYS = new Set(["id", "title", "caption", "before", "after", "layout"]);
const SIDE_KEYS = new Set(["kind", "source", "label"]);
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

const nonEmpty = (v) => typeof v === "string" && v.trim() !== "";
const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
/** Unknown keys are errors: a typo'd `captoin` would otherwise render a frame with no caption. */
const unknownKeys = (obj, known, at) =>
  Object.keys(obj)
    .filter((k) => !known.has(k))
    .map((k) => `${at}.${k}: unknown key (expected ${[...known].join(", ")})`);

function sideErrors(side, at) {
  if (!isObject(side)) return [`${at} is missing — every pair needs a "before" and an "after"`];
  const errors = unknownKeys(side, SIDE_KEYS, at);
  if (!KINDS.includes(side.kind))
    errors.push(`${at}.kind must be "mermaid" or "markdown" — got ${JSON.stringify(side.kind)}`);
  if (!nonEmpty(side.source)) errors.push(`${at}.source is missing or empty`);
  else if (side.kind === "mermaid" && /^\s*```/.test(side.source))
    errors.push(`${at}.source starts with a \`\`\` fence — give the diagram body only`);
  if (side.label !== undefined && typeof side.label !== "string")
    errors.push(`${at}.label must be a string`);
  return errors;
}

function pairErrors(p, at, seen) {
  if (!isObject(p)) return [`${at}: expected an object`];
  const errors = unknownKeys(p, PAIR_KEYS, at);
  for (const k of ["id", "title", "caption"])
    if (!nonEmpty(p[k])) errors.push(`${at}.${k} is missing or empty`);
  if (nonEmpty(p.id) && !ID_RE.test(p.id))
    errors.push(`${at}.id "${p.id}" must be filename-safe (letters, digits, "-", "_")`);
  if (nonEmpty(p.id) && seen.has(p.id)) errors.push(`${at}.id "${p.id}" is a duplicate`);
  seen.add(p.id);
  if (p.layout !== undefined && !LAYOUTS.includes(p.layout))
    errors.push(`${at}.layout must be one of ${LAYOUTS.join("|")}`);
  return [
    ...errors,
    ...sideErrors(p.before, `${at}.before`),
    ...sideErrors(p.after, `${at}.after`),
  ];
}

/** Every problem with a parsed pairs file, each naming its field. Empty means renderable. */
export function validatePairs(data) {
  if (!(isObject(data) && Array.isArray(data.pairs))) {
    const hint = Array.isArray(data) ? ` — got a bare array; wrap it as {"pairs": [...]}` : "";
    return [`top level: expected {"pairs": [...]}${hint}`];
  }
  if (!data.pairs.length) return [`pairs: empty — nothing to render`];
  const seen = new Set();
  return data.pairs.flatMap((p, i) => pairErrors(p, `pairs[${i}]`, seen));
}

/** Each flag: how its value is read, and the check that names a bad one. */
const FLAGS = {
  scale: [Number, (v) => v >= 0.5 && v <= 4, "--scale must be a number in 0.5–4"],
  quality: [Number, (v) => Number.isInteger(v) && v >= 1 && v <= 100, "--quality must be 1–100"],
  budget: [Number, (v) => v >= 0, "--budget must be KB ≥ 0 (0 = no budget)"],
  mode: [String, (v) => Boolean(MODES[v]), "--mode must be light|dark|both"],
  layout: [String, (v) => LAYOUTS.includes(v), `--layout must be ${LAYOUTS.join("|")}`],
};

/** Flags → options, with every bad value named. `budget` defaults to 100KB at scale ≤ 1 only —
 *  a scale > 1 frame is the shareable set for an issue comment, never the tree. */
export function parseArgs(argv) {
  const opts = { scale: 1, quality: 82, mode: "both", layout: "auto" };
  const positional = [];
  const errors = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") opts.help = true;
    else if (!a.startsWith("--")) positional.push(a);
    else {
      const [k, inline] = a.slice(2).split("=");
      const raw = inline ?? argv[++i];
      if (FLAGS[k]) opts[k] = FLAGS[k][0](raw);
      else errors.push(`unknown flag --${k}`);
    }
  }
  for (const [k, [, ok, message]] of Object.entries(FLAGS))
    if (opts[k] !== undefined && !ok(opts[k])) errors.push(message);
  const [pairsFile, outDir] = positional;
  if (!(pairsFile && outDir)) errors.push("usage: mermaid-pairs.mjs <pairs.json> <outdir> [flags]");
  opts.budget ??= opts.scale <= 1 ? BUDGET_KB : 0;
  return { ...opts, pairsFile, outDir, errors };
}
