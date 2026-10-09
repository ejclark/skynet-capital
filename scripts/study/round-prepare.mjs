// A study round's opening steps (#4943): preflight (0), the member cards (1) and the canary (2).
// Nothing a blind role reads exists until these pass: the pin and its composed run are checked,
// the machine-made inputs (census, facts sheet, harvest) are taken, the cards are built by script
// and linted, and every blind role proves it knows nothing before it is shown anything.

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  closeSync,
  existsSync,
  openSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, relative } from "node:path";
import { memberCard } from "./packets.mjs";
import { isHarnessPath, overlayManifest } from "./pin-plan.mjs";
import { checkCards } from "./round-control.mjs";
import {
  BLIND_ROLES,
  canaryQuestion,
  canaryVerdict,
  isControl,
  lintFeedback,
  mergeFacts,
  primingCounts,
  profileProblems,
} from "./round-plan.mjs";
import { readSchema, userMessage } from "./sealed.mjs";

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** The tree hash of a checkout's harness, exactly as pin.mjs records an overlay's. */
export function harnessTree(root) {
  const files = [];
  const walk = (abs) => {
    for (const e of readdirSync(abs, { withFileTypes: true })) {
      const full = join(abs, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.isFile()) files.push(relative(root, full));
    }
  };
  walk(join(root, "scripts/study"));
  const kept = files.filter(isHarnessPath);
  const listed = kept.map((path) => ({ path, sha256: sha(readFileSync(join(root, path))) }));
  return overlayManifest(listed).tree;
}

/**
 * The pin must carry this checkout's harness and a composed run. A pin with no composed run is
 * prepared here (nothing can be reading it); a pin whose harness differs is REFUSED with the
 * command, never re-prepared in place — pins are shared, and another round may be reading its
 * .study-run right now.
 */
function checkPin(ctx, step, dir) {
  const recordPath = join(ctx.pin, ".study-pin.json");
  if (!existsSync(recordPath)) {
    throw new Error(
      `${ctx.pin} is not a pin — node scripts/study/pin.mjs prepare --commit <sha> --dir ${ctx.pin}`,
    );
  }
  let record = readJson(recordPath);
  const tree = harnessTree(ctx.here);
  const composed = existsSync(join(ctx.run, "manifest.json"));
  if (composed && record.harness?.tree !== tree) {
    throw new Error(
      `the pin's harness is not this checkout's — once no other round is reading ${ctx.pin}: ` +
        `node scripts/study/pin.mjs prepare --commit ${record.pin} --dir ${ctx.pin}`,
    );
  }
  if (!composed) {
    ctx.log(step, "prepare", { note: "no composed run — pin.mjs prepare", pin: record.pin });
    const fd = openSync(join(dir, "prepare.log"), "w");
    const args = [join(ctx.here, "scripts/study/pin.mjs"), "prepare", "--commit", record.pin];
    const res = spawnSync(process.execPath, [...args, "--dir", ctx.pin], {
      cwd: ctx.here,
      stdio: ["ignore", fd, fd],
    });
    closeSync(fd);
    record = readJson(recordPath);
    // prepare exits with parity's status; a parity row out of bar is reported, not fatal here.
    ctx.log(step, "prepared", { parity: res.status });
    if (record.harness?.tree !== tree) throw new Error("pin.mjs prepare left a different harness");
    if (!existsSync(join(ctx.run, "manifest.json"))) throw new Error("prepare composed no run");
  }
  const manifest = readJson(join(ctx.run, "manifest.json"));
  ctx.log(step, "pin", { pin: record.pin, harness: tree, instant: manifest.instant });
}

/** Census every planned (world, viewer, routes) not already taken. */
function takeCensuses(ctx, step, dir) {
  const cap = ctx.opts.cap ?? ctx.p.censusCap;
  for (const c of ctx.censuses) {
    const cdir = join(dir, c.key);
    if (existsSync(join(cdir, "census.json"))) {
      ctx.log(step, "census-kept", { key: c.key });
      continue;
    }
    rmSync(cdir, { recursive: true, force: true });
    const args = ["--run", ctx.run, "--world", c.world, "--viewer", c.viewer, "--out", cdir];
    args.push("--cap", String(cap), "--viewport", c.viewports.join(","));
    for (const r of c.routes) args.push("--route", r);
    const status = ctx.tool("census.mjs", args, `${cdir}.log`);
    if (status !== 0) throw new Error(`census ${c.key} exited ${status} — ${cdir}.log`);
    const census = readJson(join(cdir, "census.json"));
    const unstubbed = [...new Set(census.routes.flatMap((r) => r.world?.unstubbed ?? []))];
    ctx.log(step, "census", { key: c.key, controls: census.controls.length, cap, unstubbed });
  }
}

/** One facts sheet per world, merged; then the harvest over the label censuses. */
function factsAndHarvest(ctx, step, dir) {
  const worlds = [
    ...new Set([...ctx.matrix.map((r) => r.world), ...ctx.censuses.map((c) => c.world)]),
  ];
  const sheets = [];
  for (const world of worlds) {
    const file = join(dir, `facts-${world}.json`);
    if (!existsSync(file)) {
      const viewers = new Set([
        ...ctx.matrix.filter((r) => r.world === world).map((r) => r.viewer),
        ...ctx.censuses.filter((c) => c.world === world).map((c) => c.viewer),
      ]);
      const args = ["--run", ctx.run, "--world", world, "--out", file];
      for (const v of viewers) args.push("--viewer", v);
      const status = ctx.tool("worlds/facts.mjs", args, `${file}.log`);
      if (status !== 0) throw new Error(`facts ${world} exited ${status} — ${file}.log`);
    }
    sheets.push(readJson(file));
  }
  const merged = mergeFacts(sheets);
  writeFileSync(join(dir, "facts.json"), `${JSON.stringify(merged, null, 1)}\n`);
  ctx.log(step, "facts", { worlds, facts: merged.facts.length });
  const harvest = join(dir, "harvest");
  if (!existsSync(join(harvest, "labels.txt"))) {
    const dirs = ctx.censuses.filter((c) => c.for.includes("labels")).map((c) => join(dir, c.key));
    const args = ["--out", harvest, "--facts", join(dir, "facts.json"), ...dirs];
    const status = ctx.tool("harvest.mjs", args, `${harvest}.log`);
    if (status !== 0) throw new Error(`harvest exited ${status} — ${harvest}.log`);
  }
  ctx.log(step, "harvest", { labels: ctx.rel(join(harvest, "labels.txt")) });
}

/** Step 0. */
export function preflight(ctx) {
  const step = "0-preflight";
  const dir = ctx.dir(step);
  const problems = profileProblems(ctx.p);
  if (problems.length > 0) throw new Error(`area config: ${problems.join("; ")}`);
  // The sign-in is checked by round.mjs on every start, resumed or not — not only here.
  if (ctx.stub) ctx.log(step, "stub", { note: `every call answered from ${ctx.stub}` });
  for (const f of ["keywords.txt", "gold.md"]) {
    if (!existsSync(join(ctx.sealed, f))) throw new Error(`--sealed ${ctx.sealed} holds no ${f}`);
  }
  checkPin(ctx, step, dir);
  takeCensuses(ctx, step, dir);
  factsAndHarvest(ctx, step, dir);
  return { censuses: ctx.censuses.map((c) => c.key) };
}

/** Step 1: the member cards, by script, linted as cards; the page list linted as a role packet. */
export function cards(ctx) {
  const step = "1-cards";
  const dir = ctx.dir(step);
  const members = [...new Set(ctx.matrix.map((r) => r.member))];
  const hashes = {};
  for (const m of members) {
    const md = readFileSync(join(ctx.here, "docs/members", `${m}.md`), "utf8");
    const card = memberCard(md, { cutoff: ctx.p.cutoff, name: m });
    writeFileSync(join(dir, `${m}.md`), card.text);
    hashes[m] = card.sha256;
  }
  writeFileSync(join(dir, "hashes.json"), `${JSON.stringify(hashes, null, 2)}\n`);
  // A control round asks the main round's questions of the main round's members, verbatim.
  if (isControl(ctx.opts)) checkCards(ctx, hashes);
  const files = members.map((m) => join(dir, `${m}.md`));
  const linted = ctx.lint("card", files);
  const priming = primingCounts(linted.stdout);
  ctx.log(step, "cards", { hashes, priming });
  if (linted.status !== 0) {
    throw new Error(`card lint refused: ${lintFeedback(linted.stdout).join(" · ")}`);
  }
  writeFileSync(join(dir, "pages.md"), `${ctx.p.pages.join("\n\n")}\n`);
  const pages = ctx.lint("role", [join(dir, "pages.md")]);
  if (pages.status !== 0) {
    throw new Error(`page list lint refused: ${lintFeedback(pages.stdout).join(" · ")}`);
  }
  ctx.log(step, "pages-clean", { pages: ctx.p.pages.length });
  return { members, priming };
}

/** Step 2: every blind role, asked what it knows, before it is shown anything. */
export async function canary(ctx) {
  const step = "2-canary";
  const dir = ctx.dir(step);
  const question = canaryQuestion(readFileSync(join(ctx.roles, "canary.md"), "utf8"));
  const call = ctx.call(step);
  const failed = [];
  for (const role of BLIND_ROLES) {
    const answer = await call({
      role: "canary",
      rolePath: join(ctx.roles, `${role}.md`),
      schema: readSchema("canary"),
      message: userMessage(question),
    });
    const verdict = canaryVerdict(answer);
    writeFileSync(join(dir, `${role}.json`), `${JSON.stringify({ answer, verdict }, null, 1)}\n`);
    ctx.log(step, verdict.ok ? "clean" : "FAILED", { role, why: verdict.why });
    if (!verdict.ok) failed.push(role);
  }
  if (failed.length > 0) throw new Error(`canary failed for ${failed.join(", ")} — round void`);
  return { roles: BLIND_ROLES.length };
}
