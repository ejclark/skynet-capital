#!/usr/bin/env node
// The one place that turns `flyctl image show --json` into a deployable image reference — or into
// NOTHING, which is the whole point.
//
// Provenance (run 33024006048, issue #671): the bots app's first-ever deploy had no previous image,
// so `flyctl image show` answered with every field null. The jq expression that lived inline in
// pipeline.yml interpolated those nulls straight into a string and produced the literal
// `null/null:null`. That string is not empty, so the rollback step's `!= ''` guard waved it through,
// and the rollback deployed a image that cannot exist:
//
//     Could not find image "docker.io/null/null:null"
//
// One failing step became two, and a rollback path that exists to save a bad release instead became
// the thing that failed. The same expression was pasted in FOUR places — including the DASHBOARD's
// rollback, where the same null answer would have broken the recovery of the live public app.
//
// So the rule this module exists to hold: a reference is emitted only when every component of it is
// a real, non-empty string. Anything else prints nothing at all, because "no previous image" is a
// legitimate, expected state (a first deploy) and its correct rendering is silence — the callers
// already read empty as "rollback unavailable this run" and skip.
//
// CLI contract (shell-friendly, ALWAYS exit 0 — this is a lookup, never a gate):
//   flyctl image show -a <app> --json | node scripts/fly-image-ref.mjs
// prints one line (the ref) on success, or nothing. Malformed JSON, empty stdin, an empty array and
// a null-filled record are all the same answer: silence. Exiting non-zero would abort the caller's
// `set -e` step over the entirely normal case of an app with no image yet.
import { readFileSync } from "node:fs";

/** A usable ref component: a real string with something in it. Rejects null/undefined/numbers/"".
 *  The literal "null" is refused too — that is the exact token the old jq expression emitted, so a
 *  caller still piping pre-interpolated text can never resurrect the `null/null:null` deploy. */
function component(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed === "" || trimmed === "null" ? "" : trimmed;
}

/**
 * Pure. The deployable reference for one `flyctl image show` record, or "" when it has none.
 * Digest form wins over tag form: a digest pins the exact bits, a tag can be moved out from under
 * a rollback. Registry and repository are required by both forms.
 */
export function refFromRecord(record) {
  if (!record || typeof record !== "object") return "";
  const registry = component(record.Registry);
  const repository = component(record.Repository);
  if (!(registry && repository)) return "";
  const digest = component(record.Digest);
  if (digest) return `${registry}/${repository}@${digest}`;
  const tag = component(record.Tag);
  return tag ? `${registry}/${repository}:${tag}` : "";
}

/** Pure. The reference for a whole `flyctl image show --json` payload (a record or an array). */
export function refFromPayload(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return ""; // flyctl printed an error, or nothing — either way there is no image to name.
  }
  return refFromRecord(Array.isArray(parsed) ? parsed[0] : parsed);
}

if (process.argv[1]?.endsWith("fly-image-ref.mjs")) {
  let stdin = "";
  try {
    stdin = readFileSync(0, "utf8");
  } catch {
    stdin = ""; // no stdin attached — same answer as an empty one.
  }
  const ref = refFromPayload(stdin);
  if (ref) console.log(ref);
}
