// Reuse delta: which copies did THIS change add? `dupe-scan.mjs --diff <base>` is the front door.
//
// The whole-tree scan is red on standing debt on main, so it cannot tell a new paste from an old one
// and nobody reads it. A name match alone is no better: over 453 merged PRs it fired 415 times, and
// the fires were moves, governed consolidations and homonyms as often as pastes. So a row here needs
// three things: the file did not define the name before, no other file stopped defining it in this
// change (that is a move or a consolidation), and the two bodies match once formatting, comments and
// types are gone. A same-named definition with a different body is kept apart under `sameName`: a
// reader can judge "same name, different units", a script cannot. Reads git objects only, so it
// replays any historical change and never depends on the working tree.
//
// Measured 2026-11-01 over the 456 commits since 10-01 that touched src or app/src: 78 rows in 46
// commits (10%), against 257 same-named and 27 moved rows it keeps out. 20 rows sampled and read by
// eye: 18 true pastes, 0 moves, 2 homonyms (both `refuse`, one shape with two return types, which a
// body match cannot see once types are gone). The kill rule: under 50% on a fresh sample of 20, take
// the line back out of scripts/ship.sh and leave this as a flag. Known miss: the same constant spelled
// two ways (`60 * 60 * 1000`, `3_600_000`) lands under sameName.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { stripTypeScriptTypes } from "node:module";

const ROOTS = ["src", "app/src"];
const DEF = /^(?:export\s+)?(?:async\s+)?(?:function|const|class)\s+([A-Za-z_$][\w$]*)/gm;
const IN_SCOPE = (path) =>
  ROOTS.some((root) => path.startsWith(`${root}/`)) &&
  (path.startsWith("app/") ? /\.tsx?$/ : /\.ts$/).test(path) &&
  !/\.(?:d|gen|spec|test)\.tsx?$/.test(path);

/** Biome-formatted statements close at column 0. A template literal's lines do not count. */
function statementAt(text, start) {
  const lines = text.slice(start).split("\n");
  let inTemplate = false;
  const closes = (line) => /^[})\]]/.test(line) && !/[{([]$|=>$/.test(line.trimEnd());
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const wasInTemplate = inTemplate;
    if ((line.match(/(?<!\\)`/g) ?? []).length % 2) inTemplate = !inTemplate;
    if (inTemplate || wasInTemplate) continue;
    if (i === 0 && /[;}]\s*(?:\/\/.*)?$/.test(line)) return line;
    if (i > 0 && closes(line)) return lines.slice(0, i + 1).join("\n");
    if (i > 0 && /^\S/.test(line)) return lines.slice(0, i).join("\n");
  }
  return lines.join("\n");
}

/** Node 24 (.nvmrc) marks this experimental, and that warning would be stderr noise on every ship. */
function withoutTypes(code) {
  const emit = process.emitWarning;
  process.emitWarning = () => undefined;
  try {
    return stripTypeScriptTypes(code);
  } catch {
    return code; // JSX, or a fragment the stripper refuses: compare it with its types on.
  } finally {
    process.emitWarning = emit;
  }
}

const normalized = (statement) =>
  withoutTypes(statement)
    .replace(/^export\s+/, "")
    .replace(/\/\*[\s\S]*?\*\/|(^|\s)\/\/.*$/gm, "$1")
    .replace(/\s+/g, "")
    .replace(/,([)}\]])/g, "$1");

function definitions(text) {
  const defs = new Map(); // name → { line, start }; an overload's last signature is its implementation
  for (const match of text.matchAll(DEF)) {
    const line = text.slice(0, match.index).split("\n").length;
    defs.set(match[1], { line, start: match.index });
  }
  return defs;
}

/** The normalized body of one top-level definition, or null when the text does not define it. */
export function bodyOf(text, name) {
  const def = definitions(text).get(name);
  return def ? normalized(statementAt(text, def.start)) : null;
}

const hash = (body) => createHash("sha1").update(body).digest("hex");
const pushTo = (map, key, value) => map.set(key, [...(map.get(key) ?? []), value]);

function gitIn(cwd) {
  return (...args) => {
    const run = spawnSync("git", args, { cwd, encoding: "utf8", maxBuffer: 2 ** 30 });
    if (run.status !== 0) throw new Error(`git ${args[0]} failed: ${run.stderr.trim()}`);
    return run.stdout;
  };
}

/** What this change did to names: the files each new name landed in, and the names it took away. */
function namesTouched(git, from, head, ignore) {
  const added = new Map(); // name → [file]
  const removed = new Set();
  const namesAt = (ref, path) => new Set(definitions(git("show", `${ref}:${path}`)).keys());
  const rows = git("diff", "--name-status", "--no-renames", from, head, "--", ...ROOTS)
    .split("\n")
    .filter(Boolean)
    .map((row) => row.split("\t"))
    .filter(([, path]) => IN_SCOPE(path));
  for (const [status, path] of rows) {
    const before = status === "A" ? new Set() : namesAt(from, path);
    const after = status === "D" ? new Set() : namesAt(head, path);
    for (const name of before) if (!after.has(name)) removed.add(name);
    for (const name of after) {
      if (!(before.has(name) || ignore.includes(name))) pushTo(added, name, path);
    }
  }
  return { added, removed };
}

/** Every definer at head of the wanted names. One batch read, since it walks thousands of files. */
function definersAt(cwd, git, head, wanted) {
  const tree = git("ls-tree", "-r", "--full-tree", head, "--", ...ROOTS)
    .split("\n")
    .filter(Boolean)
    .map((row) => row.split("\t"))
    .filter(([, path]) => IN_SCOPE(path));
  const batch = spawnSync("git", ["cat-file", "--batch"], {
    cwd,
    input: `${tree.map(([meta]) => meta.split(" ")[2]).join("\n")}\n`,
    maxBuffer: 2 ** 31 - 1,
  });
  if (batch.status !== 0) throw new Error(`git cat-file failed: ${batch.stderr}`);
  const definers = new Map(); // name → [{ file, line, body }]
  let offset = 0;
  for (const [, file] of tree) {
    const eol = batch.stdout.indexOf(10, offset);
    const size = Number(batch.stdout.toString("latin1", offset, eol).split(" ")[2]);
    const text = batch.stdout.toString("utf8", eol + 1, eol + 1 + size);
    offset = eol + 1 + size + 1;
    for (const [name, def] of definitions(text)) {
      if (!wanted.has(name)) continue;
      pushTo(definers, name, {
        file,
        line: def.line,
        body: normalized(statementAt(text, def.start)),
      });
    }
  }
  return definers;
}

const location = ({ file, line }) => ({ file, line });

/** One row per body this change added under a name: a paste when another definer shares the body. */
function rowsFor(name, files, definers) {
  const groups = new Map(); // body hash → the definers sharing it
  for (const def of definers) pushTo(groups, hash(def.body), def);
  const rows = { pastes: [], sameName: [] };
  for (const group of groups.values()) {
    const added = group.filter((def) => files.includes(def.file)).map(location);
    if (!added.length) continue;
    const isOld = (def) => !files.includes(def.file);
    if (group.length >= 2) {
      rows.pastes.push({ name, added, existing: group.filter(isOld).map(location) });
    } else {
      rows.sameName.push({ name, added, existing: definers.filter(isOld).map(location) });
    }
  }
  return rows;
}

export function reuseDelta({
  cwd = process.cwd(),
  base,
  head = "HEAD",
  ignore = ["main", "Route"],
}) {
  const git = gitIn(cwd);
  const from = git("merge-base", base, head).trim();
  const { added, removed } = namesTouched(git, from, head, ignore);
  const delta = { base: from, head, pastes: [], sameName: [], moved: [] };
  if (!added.size) return delta;
  const definers = definersAt(cwd, git, head, new Set(added.keys()));
  for (const [name, files] of added) {
    const all = definers.get(name) ?? [];
    if (all.length < 2) continue;
    if (removed.has(name)) {
      delta.moved.push({ name, added: files });
      continue;
    }
    const rows = rowsFor(name, files, all);
    delta.pastes.push(...rows.pastes);
    delta.sameName.push(...rows.sameName);
  }
  return delta;
}

const at = ({ file, line }) => `${file}:${line}`;

/** One line per row: what ship prints. The existing list is capped: a tenth copy adds nothing. */
export function deltaLine({ name, added, existing }) {
  const shown = existing.slice(0, 2).map(at).join(", ");
  const more = existing.length > 2 ? ` and ${existing.length - 2} more` : "";
  const home = shown ? `already in ${shown}${more}` : "defined more than once in this change";
  return `reuse: ${name} in ${added.map(at).join(", ")} is a copy, ${home}; import it instead`;
}

/** A name two bodies share. Whether they are one concept is a reader's call, so it says only that. */
export function sameNameLine({ name, added, existing }) {
  const shown = existing.slice(0, 2).map(at).join(", ");
  return `same name: ${name} in ${added.map(at).join(", ")}, different body in ${shown}`;
}
