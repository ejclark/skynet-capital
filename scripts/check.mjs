#!/usr/bin/env node
// npm run check — fix, typecheck and test what changed, in ONE call, printing only the failures
// (#5191). A token-burn audit of three days of session transcripts (2026-10-08..11) counted 909
// back-to-back verify calls with no edit between them: one check split across several calls
// (lint → fix → re-lint, root tests then app tests) or re-run just to filter its output. Every
// extra call re-reads the agent's whole context, so the waste is the NUMBER of calls, not their
// size — which is why this is one command and not an output-filter hook (the issue's settled fork).
//
//   npm run check               # biome safe fixes on changed files → typecheck → related tests
//   npm run check -- --no-fix   # same, but writes no files in the repo (logs still go to tmp)
//   npm run check -- --full     # whole repo, full suites — what `npm run verify` runs
//
// "Changed" = everything differing from the merge-base with origin/main: committed, staged,
// unstaged and untracked. (`biome --changed` skips uncommitted edits, and an agent between two
// edits has nothing committed yet.) Tests are the root and app suites' `rstest --related` set —
// the import graph, both directions — plus any spec named after a changed file, because a script
// spec drives its `.mjs` through a subprocess and so never imports it.
//
// Output: one summary line (`✓ lint · ✓ typecheck · ✗ tests 2 failed`), then only the failing
// diagnostics, capped at CAP lines; full logs live outside the repo, named after the cap. Not a
// replacement for `npm run verify` or ship.sh's local verify — CI parity stays there.
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, relative, resolve } from "node:path";

export const CAP = 60;
const CODE_RE = /\.(?:[cm]?[jt]s|tsx|jsx)$/;
const LINT_RE = /\.(?:[cm]?[jt]s|tsx|jsx|json|jsonc|css)$/;

/** One line per gate: `✓ lint · ✓ typecheck · ✗ tests 2 failed`. */
export function summaryLine(gates) {
  return gates.map((g) => `${g.ok ? "✓" : "✗"} ${g.name}${g.note ? ` ${g.note}` : ""}`).join(" · ");
}

/**
 * The whole report: the summary line, then each failing gate's diagnostics, capped at `cap` lines
 * in total. Past the cap, one line counts what was cut and names where the full logs are.
 */
export function formatReport(gates, { cap = CAP } = {}) {
  const out = [summaryLine(gates)];
  const failing = gates.filter((g) => !g.ok);
  const lines = failing.flatMap((g) => g.lines ?? []);
  out.push(...lines.slice(0, cap));
  if (lines.length > cap) {
    const logs = failing.flatMap((g) => g.logs ?? []);
    out.push(
      `… ${lines.length - cap} more lines — full log${logs.length === 1 ? "" : "s"}: ${logs.join(" ")}`,
    );
  }
  return out.join("\n");
}

/** Biome errors (`×`) from `--reporter=concise`; warnings (`!`) never fail the gate. */
export function biomeErrors(text) {
  return text.split("\n").filter((l) => l.startsWith("× "));
}

/** tsc `--pretty false` errors, each with its indented continuation lines, paths under `prefix`. */
export function tscErrors(text, prefix = "") {
  const out = [];
  let inError = false;
  for (const line of text.split("\n")) {
    if (/: error TS\d+:/.test(line)) {
      out.push(prefix + line);
      inError = true;
    } else if (inError && /^\s+\S/.test(line)) out.push(line);
    else inError = false;
  }
  return out;
}

/**
 * Failures from rstest's JSON reporter: `✗ <spec> :: <test> — <first message line>`, plus a
 * file-level line for a spec that failed to load. Anything printed before the report (rstest's
 * "no related tests" notice) is skipped. Returns null when no report could be parsed.
 */
export function rstestFailures(text, prefix = "") {
  const start = text.indexOf("{\n");
  if (start < 0) return null;
  let report;
  try {
    report = JSON.parse(text.slice(start));
  } catch {
    return null;
  }
  const first = (e) => String(e?.message ?? "").split("\n")[0];
  const lines = [];
  for (const file of report.files ?? []) {
    const path = prefix + file.testPath;
    for (const e of file.errors ?? []) lines.push(`✗ ${path} — ${first(e)}`);
    for (const r of file.results ?? []) {
      if (r.status !== "fail") continue;
      const name = [...(r.parentNames ?? []), r.name].filter(Boolean).join(" > ");
      lines.push(`✗ ${path} :: ${name} — ${first(r.errors?.[0])}`);
    }
  }
  return { failed: report.summary?.failedTests ?? 0, files: report.summary?.testFiles ?? 0, lines };
}

const git = (...args) => {
  const r = spawnSync("git", args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr.trim()}`);
  return r.stdout.trim();
};

/** Files differing from the merge-base with origin/main, including uncommitted and untracked. */
function changedFiles(root) {
  const base = git("merge-base", "origin/main", "HEAD");
  const diffed = git("diff", "--name-only", "--diff-filter=d", base).split("\n");
  const untracked = git("ls-files", "--others", "--exclude-standard").split("\n");
  const files = [...new Set([...diffed, ...untracked])].filter(Boolean);
  return { base, files: files.map((f) => resolve(root, f)) };
}

/** Spec files named after a changed file — `scripts/foo.mjs` → any `foo.spec.ts` under tests/. */
function namesakeSpecs(dir, changed) {
  const stems = new Set(changed.map((f) => basename(f).replace(/\.[^.]+$/, "")));
  const out = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) walk(join(d, e.name));
      else if (stems.has(e.name.replace(/\.spec\.tsx?$/, "")) && /\.spec\.tsx?$/.test(e.name))
        out.push(join(d, e.name));
    }
  };
  walk(join(dir, "tests"));
  return out;
}

/** Run a command to completion, the whole output kept in `log`. Never throws on a red exit. */
function run(cmd, args, { cwd, log }) {
  return new Promise((done) => {
    const child = spawn(cmd, args, {
      cwd,
      env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1" },
    });
    let text = "";
    child.stdout.on("data", (d) => {
      text += d;
    });
    child.stderr.on("data", (d) => {
      text += d;
    });
    child.on("close", (code) => {
      writeFileSync(log, text);
      done({ code, text, log });
    });
  });
}

const bin = (root, name) => join(root, "node_modules", ".bin", name);
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

async function lintGate(root, { files, fix, logDir }) {
  const targets = files ? files.filter((f) => LINT_RE.test(f)) : ["."];
  if (targets.length === 0) return { name: "lint", ok: true, note: "(nothing to lint)" };
  const args = [
    "check",
    "--reporter=concise",
    "--no-errors-on-unmatched",
    "--files-ignore-unknown=true",
  ];
  if (fix) args.push("--write");
  const r = await run(bin(root, "biome"), [...args, ...targets], {
    cwd: root,
    log: join(logDir, "lint.log"),
  });
  const fixed = r.text.match(/Fixed (\d+) files?/)?.[1];
  const errors = biomeErrors(r.text);
  const lines = errors.length || r.code === 0 ? errors : r.text.trim().split("\n").slice(-10);
  const notes = [r.code !== 0 && plural(errors.length, "error"), fixed && `(fixed ${fixed})`];
  return {
    name: "lint",
    ok: r.code === 0,
    note: notes.filter(Boolean).join(" "),
    lines,
    logs: [r.log],
  };
}

async function typecheckGate(root, { withApp, logDir }) {
  const suites = [{ cwd: root, prefix: "", log: join(logDir, "typecheck.log") }];
  if (withApp)
    suites.push({ cwd: join(root, "app"), prefix: "app/", log: join(logDir, "typecheck-app.log") });
  const runs = await Promise.all(
    suites.map(async (s) => {
      const r = await run(
        bin(s.cwd, "tsc"),
        ["-p", "tsconfig.json", "--noEmit", "--pretty", "false"],
        s,
      );
      const errors = tscErrors(r.text, s.prefix);
      return {
        ...r,
        lines: errors.length || r.code === 0 ? errors : r.text.trim().split("\n").slice(-10),
      };
    }),
  );
  const count = runs.reduce((n, r) => n + r.lines.filter((l) => /: error TS/.test(l)).length, 0);
  const ok = runs.every((r) => r.code === 0);
  const note = [!ok && plural(count, "error"), !withApp && "(root only)"].filter(Boolean).join(" ");
  return {
    name: "typecheck",
    ok,
    note,
    lines: runs.flatMap((r) => r.lines),
    logs: runs.map((r) => r.log),
  };
}

async function testGate(root, { files, logDir }) {
  const suites = [
    { cwd: root, prefix: "", log: join(logDir, "tests.log") },
    { cwd: join(root, "app"), prefix: "app/", log: join(logDir, "tests-app.log") },
  ];
  const runs = await Promise.all(
    suites.map(async (s) => {
      const args = ["run", "--reporter=json"];
      if (files) {
        const sources = files.filter((f) => CODE_RE.test(f));
        const targets = [...new Set([...sources, ...namesakeSpecs(s.cwd, files)])];
        if (targets.length === 0) return { code: 0, failed: 0, files: 0, lines: [], log: s.log };
        args.push("--passWithNoTests", "--related", ...targets);
      }
      const r = await run(bin(s.cwd, "rstest"), args, s);
      const parsed = rstestFailures(r.text, s.prefix);
      if (parsed) return { ...r, ...parsed };
      return {
        ...r,
        failed: 0,
        files: 0,
        lines: r.code === 0 ? [] : r.text.trim().split("\n").slice(-10),
      };
    }),
  );
  const ok = runs.every((r) => r.code === 0);
  const failed = runs.reduce((n, r) => n + r.failed, 0);
  const ran = runs.reduce((n, r) => n + r.files, 0);
  const note = ok
    ? ran === 0
      ? "(no related tests)"
      : `(${plural(ran, "file")})`
    : `${failed} failed`;
  return {
    name: "tests",
    ok,
    note,
    lines: runs.flatMap((r) => r.lines),
    logs: runs.map((r) => r.log),
  };
}

async function main(argv) {
  const full = argv.includes("--full");
  const fix = !argv.includes("--no-fix");
  const root = git("rev-parse", "--show-toplevel");
  const logDir = join(
    tmpdir(),
    "skynet-check",
    createHash("sha1").update(root).digest("hex").slice(0, 8),
  );
  mkdirSync(logDir, { recursive: true });

  let files = null;
  if (!full) {
    const changed = changedFiles(root);
    if (changed.files.length === 0) {
      console.log(
        `nothing changed since origin/main (${changed.base.slice(0, 8)}) — nothing to check`,
      );
      return 0;
    }
    files = changed.files;
  }
  const withApp = full || files.some((f) => relative(root, f).startsWith("app/"));

  // Lint first and alone: its fixes are what the typecheck and the tests must see.
  const lint = await lintGate(root, { files, fix, logDir });
  const [typecheck, tests] = await Promise.all([
    typecheckGate(root, { withApp, logDir }),
    testGate(root, { files, logDir }),
  ]);
  const gates = [lint, typecheck, tests];
  console.log(formatReport(gates));
  return gates.every((g) => g.ok) ? 0 : 1;
}

if (process.argv[1]?.endsWith("check.mjs")) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (err) => {
      console.error(`check: ${err.message}`);
      process.exit(2);
    },
  );
}
