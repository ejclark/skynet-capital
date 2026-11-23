#!/usr/bin/env node
// THE SEALED KEY, CARRIED BETWEEN CLOUD SESSIONS (#8005 slice 4) — one study's answer key packed
// into one page that lives outside the repo, and unpacked only when its hash is the one posted on
// the owning issue.
//
//   node scripts/study/seal.mjs pack   --key <key dir> --name <study> --out <page.html>
//   node scripts/study/seal.mjs unpack --page <page.html> --expect <sha256> --out <dir>
//
// WHY: a round reads its key from `--sealed <dir>` (lint, matchers, grader), and the profile
// round's key lived on the owner's laptop. A cloud session starts from a fresh container, so the
// session that seals a study and the one that grades it are different machines. The key must
// never be in the repo (every blind role's packet is built from the repo's files), so it travels
// as a PRIVATE ARTIFACT on the owner's account: the sealing session publishes the page `pack`
// writes and posts its hash on the issue; a later session reads the page back (the Artifact
// tool's `read`, which saves the page to a file) and `unpack`s it into a folder outside any
// checkout. Blind roles cannot reach it: they run with no tools in an empty folder (sealed.mjs).
//
// WHAT THE PAGE HOLDS: every top-level file of the key folder (gold.md, primes.json, the controls'
// expect files, the keyword list), base64 inside one JSON script block so the key's words are not
// in the page's text, with each file's sha256. The BUNDLE HASH is sha256 over the sorted
// (name, file hash) pairs: the line posted on the issue, which `unpack` refuses to differ from.
// `unpack` also refuses a target folder inside a git checkout, so the key cannot land in the repo.
// Pure halves specced in tests/scripts/study-seal.spec.ts.

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { isMain } from "./compat.mjs";

const USAGE =
  "usage: seal.mjs pack --key <dir> --name <study> --out <page.html>  |  " +
  "seal.mjs unpack --page <page.html> --expect <sha256> --out <dir>";
const BLOCK_ID = "sealed-key";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** A key folder's files: every top-level regular file, sorted by name. A sub-folder is refused. */
export function readKey(dir) {
  const names = readdirSync(dir).sort();
  return names.map((name) => {
    const path = join(dir, name);
    if (!statSync(path).isFile()) throw new Error(`seal: ${name} is not a file — a key is flat`);
    const bytes = readFileSync(path);
    return { name, sha256: sha256(bytes), bytes: bytes.length, b64: bytes.toString("base64") };
  });
}

/** The bundle hash: sha256 over the sorted (name, file hash) pairs — what the issue carries. */
export const bundleHash = (files) =>
  sha256(
    JSON.stringify(
      [...files].sort((a, b) => (a.name < b.name ? -1 : 1)).map((f) => [f.name, f.sha256]),
    ),
  );

const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

/**
 * The page for one key: a name, who may open it, the bundle hash, the file list — and the files
 * themselves, base64 in one JSON block nothing renders.
 */
export function keyPage({ name, files }) {
  const hash = bundleHash(files);
  const payload = Buffer.from(JSON.stringify({ name, hash, files })).toString("base64");
  const rows = files
    .map(
      (f) =>
        `<tr><td>${esc(f.name)}</td><td class="n">${f.bytes.toLocaleString("en-US")}</td><td><code>${f.sha256.slice(0, 16)}…</code></td></tr>`,
    )
    .join("");
  return `<title>Sealed key ${esc(name)}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
/* One quiet card: a seal, not a document. Ink on paper, one wax-red accent for the seal line. */
:root { --bg: #f6f5f2; --fg: #1f2328; --muted: #5b6168; --line: #d9d6cf; --seal: #9b2c2c; --card: #ffffff;
  --body: "Inter", system-ui, sans-serif; --mono: "JetBrains Mono", ui-monospace, monospace; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg: #16181b; --fg: #e8e6e1; --muted: #a3a8ae; --line: #33373c; --seal: #e07a6f; --card: #1e2125; color-scheme: dark } }
:root[data-theme="dark"] { --bg: #16181b; --fg: #e8e6e1; --muted: #a3a8ae; --line: #33373c; --seal: #e07a6f; --card: #1e2125; color-scheme: dark }
body { background: var(--bg); color: var(--fg); font-family: var(--body);
  padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); padding-block: 32px; }
main { max-width: 40rem; margin: 0 auto; display: grid; gap: 16px; }
h1 { font-size: 1.25rem; margin: 0; text-wrap: balance; }
p { margin: 0; color: var(--muted); line-height: 1.5; }
.seal { border-left: 3px solid var(--seal); padding-left: 12px; color: var(--fg); }
.hash { font-family: var(--mono); font-size: 0.8rem; overflow-wrap: anywhere; background: var(--card);
  border: 1px solid var(--line); border-radius: 6px; padding: 10px 12px; }
.wrap { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; font-size: 0.875rem; }
td, th { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--line); }
th { font-size: 0.75rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); }
.n { text-align: right; font-variant-numeric: tabular-nums; }
code { font-family: var(--mono); font-size: 0.8rem; }
</style>
<main>
  <h1>Sealed key: ${esc(name)}</h1>
  <p class="seal">Opened only by the session that seals this study and the session that grades it, with <code>scripts/study/seal.mjs unpack</code>. The files below are not shown here.</p>
  <p>Bundle hash, as posted on the study's issue:</p>
  <div class="hash">${hash}</div>
  <div class="wrap"><table><thead><tr><th>File</th><th class="n">Bytes</th><th>sha256</th></tr></thead><tbody>${rows}</tbody></table></div>
</main>
<script type="application/json" id="${BLOCK_ID}">${payload}</script>
`;
}

/** The key a page carries, each file checked against its own hash; throws on any mismatch. */
export function readPage(html) {
  const m = new RegExp(
    `<script type="application/json" id="${BLOCK_ID}">([A-Za-z0-9+/=\\s]+)</script>`,
  ).exec(String(html));
  if (!m) throw new Error("seal: this page holds no sealed key");
  const bundle = JSON.parse(Buffer.from(m[1].replace(/\s+/g, ""), "base64").toString("utf8"));
  for (const f of bundle.files ?? []) {
    if (sha256(Buffer.from(f.b64, "base64")) !== f.sha256) {
      throw new Error(`seal: ${f.name} does not match its own hash — the page was changed`);
    }
  }
  if (bundleHash(bundle.files) !== bundle.hash)
    throw new Error("seal: the bundle hash does not add up");
  return bundle;
}

/** Is `dir` (or its nearest existing parent) inside a git checkout? */
function inCheckout(dir) {
  let at = resolve(dir);
  while (!existsSync(at)) at = resolve(at, "..");
  return (
    spawnSync("git", ["-C", at, "rev-parse", "--show-toplevel"], { encoding: "utf8" }).status === 0
  );
}

/** Write a page's key into `out`, refusing a hash other than `expect` and any folder in a repo. */
export function unpack({ html, expect, out, checkout = inCheckout }) {
  const bundle = readPage(html);
  if (bundle.hash !== expect) {
    throw new Error(`seal: this key hashes to ${bundle.hash}, not the ${expect} the issue carries`);
  }
  if (checkout(out))
    throw new Error(`seal: ${out} is inside a git checkout — a key never lands in a repo`);
  mkdirSync(out, { recursive: true });
  for (const f of bundle.files) writeFileSync(join(out, f.name), Buffer.from(f.b64, "base64"));
  return bundle;
}

function args(argv) {
  const [command, ...rest] = argv;
  const get = (flag) => {
    const i = rest.indexOf(flag);
    return i >= 0 ? rest[i + 1] : undefined;
  };
  if (command === "pack" && get("--key") && get("--name") && get("--out")) {
    return { command, key: get("--key"), name: get("--name"), out: get("--out") };
  }
  if (command === "unpack" && get("--page") && get("--expect") && get("--out")) {
    return { command, page: get("--page"), expect: get("--expect"), out: get("--out") };
  }
  throw new Error(USAGE);
}

if (isMain(import.meta.url)) {
  try {
    const a = args(process.argv.slice(2));
    if (a.command === "pack") {
      const files = readKey(a.key);
      writeFileSync(a.out, keyPage({ name: a.name, files }));
      console.log(`seal: ${files.length} files → ${a.out}\nbundle hash ${bundleHash(files)}`);
    } else {
      const b = unpack({
        html: readFileSync(a.page, "utf8"),
        expect: a.expect,
        out: resolve(a.out),
      });
      console.log(
        `seal: ${b.files.length} files of "${b.name}" → ${resolve(a.out)} (hash ${b.hash})`,
      );
    }
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  }
}
