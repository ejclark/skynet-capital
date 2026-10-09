// Reading a member-study round's files (#4943) — shared by grade.mjs and readout.mjs.
//
// A ROUND DIRECTORY holds:
//   findings.jsonl   one finding per line: {id, what, level: structural|surface, severity?,
//                    member? (members class), where?, principle?, why?, fix?,
//                    evidence?: {session?: <dir under the round>, frames?: [n…], quote?}}
//   classes.json     {<finding id>: members|experts|words|instruments} — kept apart from the
//                    findings because the matchers get them with class labels stripped
//   matches-1.json, matches-2.json, tiebreak.json?   [{finding, gold: <key id>|null, score: 1|0.5|0}]
//   checks.json?     [{finding, verdict: real|false|world-artifact, same_as?: <finding id>}]
//   touches.json?    {<key id>: true | <count> | [<session dir>…]} — which key surfaces a trace touched
//   sessions/<member>/<run>/   drive.mjs runs: summary.json · turns.jsonl · trace.jsonl · frames/
// A CONTROL ROUND holds findings.jsonl, the matcher files and control.json {expect: [<key id>…]}.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

export const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

/** JSON lines, blanks skipped; a bad line throws naming the file and line. */
export function readJsonl(path) {
  return readFileSync(path, "utf8")
    .split("\n")
    .map((line, i) => [line.trim(), i + 1])
    .filter(([line]) => line)
    .map(([line, n]) => {
      try {
        return JSON.parse(line);
      } catch {
        throw new Error(`${path}:${n} is not JSON`);
      }
    });
}

/** The file's JSON, or `fallback` when the file is absent. */
export const readOptional = (path, fallback) => (existsSync(path) ? readJson(path) : fallback);

/** A list file: a JSON array, or one entry per line (blanks and #comments dropped). */
export function readList(path) {
  const raw = readFileSync(path, "utf8").trim();
  if (raw.startsWith("[")) return JSON.parse(raw);
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}

/**
 * Every member session under <round>/sessions: {dir, rel, member, summary}. The member is the first
 * folder under sessions/; a folder with no summary.json is not a session.
 */
export function findSessions(round) {
  const root = join(round, "sessions");
  if (!existsSync(root)) return [];
  return readdirSync(root, { recursive: true })
    .map(String)
    .filter((f) => f.endsWith(`${sep}summary.json`))
    .sort()
    .map((f) => {
      const dir = join(root, f.slice(0, -"summary.json".length));
      return {
        dir,
        rel: relative(round, dir),
        member: f.split(sep)[0],
        summary: readJson(join(root, f)),
      };
    });
}
