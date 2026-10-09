// A composed world on disk (#4943 slice 2): every answer a viewer's page may ask for, keyed by the
// request it answers, each with its sha256 — so a study run can name exactly which bytes its
// members saw, and two runs on two commits can be diffed payload by payload. Area-agnostic: it
// knows requests and bodies, never a surface.
//
// THE KEY IS THE FULL REQUEST, CANONICALISED. Path plus every query parameter, sorted, minus the
// paging knobs a client tunes freely (`per_page`). `?playbook=<id>` and no filter are two
// different answers; `?per_page=30` and `?per_page=50` on page one are the same answer. A request
// whose key was never composed is not guessed at — the world reports it as unstubbed.

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Query parameters that never change which answer a request gets. */
const PAGING = new Set(["per_page"]);

/** `path?sorted&params` for a URL (string, relative, or URL object). */
export function canonicalUrl(input) {
  const url = input instanceof URL ? input : new URL(input, "http://world");
  const params = [...url.searchParams]
    .filter(([k]) => !PAGING.has(k))
    .sort(([a, av], [b, bv]) => a.localeCompare(b) || av.localeCompare(bv));
  const query = new URLSearchParams(params).toString();
  return query ? `${url.pathname}?${query}` : url.pathname;
}

const sha256 = (text) => createHash("sha256").update(text).digest("hex");

/**
 * Write one viewer's answers and return its manifest rows.
 * @param {string} dir   the world's run directory
 * @param {string} viewer
 * @param {{url: string, status: number, body: unknown, source: string}[]} answers
 */
export function writeViewer(dir, viewer, answers) {
  mkdirSync(dir, { recursive: true });
  const entries = {};
  const manifest = [];
  for (const a of answers) {
    const key = canonicalUrl(a.url);
    const text = JSON.stringify(a.body);
    const hash = sha256(text);
    entries[key] = { status: a.status, source: a.source, sha256: hash, body: a.body };
    manifest.push({ viewer, key, status: a.status, source: a.source, sha256: hash });
  }
  writeFileSync(join(dir, `${viewer}.json`), `${JSON.stringify(entries, null, 1)}\n`);
  return manifest;
}

/**
 * The answer function a world page routes through, from one viewer's composed file. Reads
 * (GET) are looked up by canonical key; writes get the composed write answer when the world
 * composed one for that path, else the router's benign default.
 */
export function answerFrom(dir, viewer) {
  const entries = JSON.parse(readFileSync(join(dir, `${viewer}.json`), "utf8"));
  return (req) => {
    const hit =
      req.method === "GET" ? entries[canonicalUrl(req.url)] : entries[`WRITE ${req.path}`];
    return hit && { status: hit.status, body: hit.body };
  };
}
