// REST FOR THE PR REVIEWER'S THIN LAYERS — reads through moneypenny's `ghRest`, writes through one
// curl call beside it, so every GitHub call this folder makes goes through `sh` (gh.mjs) and the same
// `--fail-with-body` error text every retry and classifier already reads.
//
// WHY A WRITE HELPER HERE. `ghRest` is GET only, and the reviewer has to write: a review, a commit
// status, a ledger row through the contents API. The body goes in on stdin (`--data-binary @-`),
// never argv: a ledger day file passes the argv limit long before it passes GitHub's.
import { ghRest, sh, withResponseBody } from "../moneypenny/gh.mjs";

const repoUrl = (path) =>
  path.startsWith("http")
    ? path
    : `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY ?? "ejclark/skynet-capital"}/${path.replace(/^\//, "")}`;

/** POST, PUT or PATCH one JSON body; returns the parsed response. Loud on any non-2xx. */
export function ghRestWrite(
  method,
  path,
  body,
  { token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN, run = sh } = {},
) {
  let out;
  try {
    out = run(
      "curl",
      [
        "-sS",
        "--fail-with-body",
        "-X",
        method,
        "-H",
        `Authorization: Bearer ${token ?? ""}`,
        "-H",
        "Accept: application/vnd.github+json",
        "-H",
        "Content-Type: application/json",
        "-H",
        "User-Agent: skynet-pr-review",
        "--data-binary",
        "@-",
        repoUrl(path),
      ],
      { input: JSON.stringify(body) },
    );
  } catch (err) {
    throw withResponseBody(err);
  }
  return JSON.parse(out || "null");
}

const statusIn = (err, codes) =>
  new RegExp(`returned error: (?:${codes.join("|")})\\b`).test(
    `${err?.stderr ?? ""} ${err?.message ?? ""}`,
  );

/** curl's own words for a 404. */
export const isNotFound = (err) => statusIn(err, [404]);
/** A contents-API write against a stale sha: 409 (sha mismatch) or 422 (sha missing on an update). */
export const isConflict = (err) => statusIn(err, [409, 422]);

/** The default `api` every thin layer here takes, so a spec swaps one object for the network. */
export const defaultApi = () => ({
  get: (path) => ghRest(path),
  send: (method, path, body) => ghRestWrite(method, path, body),
});
