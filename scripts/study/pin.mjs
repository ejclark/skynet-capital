// PINNED RUNS (#4943) — run a study world against an arbitrary commit with TODAY's harness.
//
//   node scripts/study/pin.mjs prepare --commit <sha> --dir <abs dir>   # npm run study:pin -- …
//   node scripts/study/pin.mjs remove  --dir <abs dir>
//
// WHY: a study measures a build that existed before its fixes landed (the pin), and the fixed
// build is its negative control. The worlds compose from the CHECKED-OUT tree's own builders
// (worlds/compose.mjs), so a world composed on main shows main's server, not the pin's. A pinned
// run therefore happens in a worktree AT the pin, with only the harness — `scripts/study/**`,
// nothing else — overlaid from this checkout. Everything the member sees (src/, app/, the
// builders, the gates) is the pin's; only the instrument is today's.
//
// prepare:
//  1. `git worktree add --detach <dir> <sha>`, recorded at once — refused if <dir> exists and is
//     not a pin this script made that is still exactly that commit (one is reused, so a re-run is
//     cheap); never the main or the running checkout;
//  2. overlays the harness and records what it overlaid in <dir>/.study-pin.json: the harness
//     commit, whether its folder had uncommitted edits, a sha256 per file and one tree hash;
//  3. gives <dir> its own installs — an APFS clone of this checkout's node_modules and
//     app/node_modules, never a symlink, and never cloned FROM one (an `npm ci` through a link
//     empties the linked install, docs/LESSONS.md 2026-10-09). A lockfile that differs at the pin
//     is recorded and warned;
//  4. `npm run build --prefix app` in <dir>;
//  5. composes every world into <dir>/.study-run and runs parity there, saving the table to
//     <dir>/.study-run/parity.txt. The exit status is parity's.
// remove: `git worktree remove --force` — only a registered, non-main worktree carrying
// `.study-pin.json` (pin-plan.mjs → removeVerdict).
//
// THE HARNESS MAY OUTLIVE THE PIN'S APIs: anything it imports from outside scripts/study/ is the
// pin's. Where that drifted, the harness feature-detects and records its fallback
// (scripts/study/compat.mjs); it never edits the pin's src/.

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import {
  cloneAttempts,
  HARNESS,
  installVerdict,
  isHarnessPath,
  overlayManifest,
  pinArgs,
  prepareVerdict,
  RECORD,
  RUN,
  removeVerdict,
  strayChanges,
  uncommittedHarness,
  worktreesFrom,
} from "./pin-plan.mjs";

const INSTALLS = ["node_modules", "app/node_modules"];
const LOCKS = ["package-lock.json", "app/package-lock.json"];

/** Run a command; throw with its stderr unless `soft`. */
function sh(cmd, args, opts = {}) {
  const out = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 1 << 26, ...opts });
  if (out.status !== 0 && !opts.soft) {
    throw new Error(`pin: ${cmd} ${args.join(" ")} exited ${out.status}\n${out.stderr ?? ""}`);
  }
  return out;
}
const git = (args, cwd) => sh("git", args, { cwd }).stdout.trim();
/** `git status --porcelain -z` untrimmed — a status line's leading space is part of its format. */
const statusZ = (args, cwd) => sh("git", ["status", "--porcelain", "-z", ...args], { cwd }).stdout;

/** A path as git prints it: symlinks resolved (macOS /tmp is /private/tmp), even if missing. */
function canonical(path) {
  if (existsSync(path)) return realpathSync(path);
  return join(canonical(dirname(path)), basename(path));
}

const SELF = git(["rev-parse", "--show-toplevel"], process.cwd());
const worktrees = () => worktreesFrom(git(["worktree", "list", "--porcelain"], SELF));

/** Every harness file in this checkout, as it stands on disk (uncommitted edits included). */
function harnessFiles() {
  const out = [];
  const walk = (abs) => {
    for (const entry of readdirSync(abs, { withFileTypes: true })) {
      const full = join(abs, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) out.push(relative(SELF, full));
    }
  };
  walk(join(SELF, HARNESS));
  return out.filter(isHarnessPath);
}

/** Replace <dir>/scripts/study wholesale with this checkout's, and say exactly what went in. */
function overlay(dir) {
  const paths = harnessFiles();
  rmSync(join(dir, HARNESS), { recursive: true, force: true });
  const files = paths.map((path) => {
    const bytes = readFileSync(join(SELF, path));
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), bytes);
    return { path, sha256: createHash("sha256").update(bytes).digest("hex") };
  });
  const manifest = overlayManifest(files);
  // --ignored too: the walk above copies an ignored file like any other, so it counts like one.
  const dirty = statusZ(["--ignored", "--untracked-files=all", "--", HARNESS], SELF);
  return {
    commit: git(["rev-parse", "HEAD"], SELF),
    uncommitted: uncommittedHarness(dirty),
    tree: manifest.tree,
    files: manifest.files,
  };
}

/** lstat as installVerdict reads it: a dangling link still exists, and is still a link. */
function seenPath(path) {
  const stat = lstatSync(path, { throwIfNoEntry: false });
  return { exists: stat !== undefined, link: stat?.isSymbolicLink() ?? false };
}

/** Clone one install into the pin, best method first; a real directory already there is kept. */
function cloneInstall(rel, dir) {
  const from = join(SELF, rel);
  const to = join(dir, rel);
  const verdict = installVerdict(seenPath(from), seenPath(to));
  if (verdict.action === "refuse") throw new Error(`pin: ${rel}: ${verdict.why}, then re-run`);
  if (verdict.action === "keep") return "kept";
  for (const attempt of cloneAttempts(from, to)) {
    const out = sh(attempt[0], attempt.slice(1), { soft: true });
    if (out.status === 0) {
      // Belt and braces: whatever cp did, the pin must not end up holding a link.
      if (seenPath(to).link) {
        rmSync(to, { force: true });
        throw new Error(`pin: ${attempt.join(" ")} left a symlink at ${to}; removed it`);
      }
      return attempt.slice(1, -2).join(" ");
    }
    rmSync(to, { recursive: true, force: true });
  }
  throw new Error(`pin: could not copy ${rel} by any method`);
}

/** Does the pin's lockfile resolve the tree this checkout's install was made from? */
function lockDrift(commit) {
  return LOCKS.filter((lock) => {
    const here = sh("git", ["rev-parse", `HEAD:${lock}`], { cwd: SELF, soft: true }).stdout;
    const there = sh("git", ["rev-parse", `${commit}:${lock}`], { cwd: SELF, soft: true }).stdout;
    return here.trim() !== there.trim();
  });
}

function writeRecord(dir, record) {
  writeFileSync(join(dir, RECORD), `${JSON.stringify(record, null, 1)}\n`);
}

/** Run a step in the pin, streamed; returns its exit status. */
function step(label, cmd, args, dir) {
  console.log(`\npin: ${label} — ${cmd} ${args.join(" ")}`);
  return spawnSync(cmd, args, { cwd: dir, stdio: "inherit" }).status;
}

function prepare({ commit: given, dir: asked }) {
  const commit = git(["rev-parse", "--verify", `${given}^{commit}`], SELF);
  const dir = canonical(asked);
  const seen = worktrees().get(dir);
  const verdict = prepareVerdict(
    {
      exists: existsSync(dir),
      worktreeHead: seen?.head,
      isMain: seen?.main ?? false,
      isSelf: dir === canonical(SELF),
      hasPinRecord: existsSync(join(dir, RECORD)),
      stray: seen ? strayChanges(statusZ(["--untracked-files=all"], dir)) : [],
    },
    commit,
  );
  if (verdict.action === "refuse") throw new Error(`pin: refusing ${dir}: ${verdict.why}`);
  if (verdict.action === "create") {
    git(["worktree", "add", "--detach", dir, commit], SELF);
    // Mark it ours at once, so a prepare that fails past here leaves a worktree `remove` clears.
    writeRecord(dir, { pin: commit, made: new Date().toISOString() });
  } else console.log(`pin: ${dir} is already a worktree at ${commit.slice(0, 12)} — reusing it`);

  const before = existsSync(join(dir, RECORD))
    ? JSON.parse(readFileSync(join(dir, RECORD), "utf8"))
    : undefined;
  const record = { pin: commit, made: new Date().toISOString(), harness: overlay(dir) };
  const h = record.harness;
  console.log(
    `pin: overlaid ${h.files.length} harness files from ${h.commit.slice(0, 12)}` +
      `${h.uncommitted ? ` (+${h.uncommitted} uncommitted)` : ""} · tree ${h.tree.slice(0, 16)}`,
  );
  const drift = lockDrift(commit);
  record.installs = {
    // A re-run keeps the install it made; the record keeps saying how that install was made.
    method: Object.fromEntries(
      INSTALLS.map((rel) => {
        const how = cloneInstall(rel, dir);
        const was = before?.installs?.method?.[rel];
        return [rel, how === "kept" && was ? was : how];
      }),
    ),
    lockfileDrift: drift,
  };
  if (drift.length > 0) {
    console.warn(`pin: WARNING ${drift.join(", ")} differ at the pin — the install is today's`);
  }
  writeRecord(dir, record);

  const steps = [
    ["build", "npm", ["run", "build", "--prefix", "app"]],
    ["compose", "npx", ["tsx", "scripts/study/worlds/compose.mjs", join(dir, RUN)]],
  ];
  record.steps = {};
  for (const [label, cmd, args] of steps) {
    record.steps[label] = step(label, cmd, args, dir);
    writeRecord(dir, record);
    if (record.steps[label] !== 0) throw new Error(`pin: ${label} exited ${record.steps[label]}`);
  }
  // Through tsx, as `npm run study:parity` does: the pin's src/ imports `.js` names for `.ts`
  // files, which Node's own type stripping does not resolve.
  console.log("\npin: parity — npx tsx scripts/study/parity.mjs --run .study-run");
  const parity = spawnSync("npx", ["tsx", "scripts/study/parity.mjs", "--run", join(dir, RUN)], {
    cwd: dir,
    encoding: "utf8",
    maxBuffer: 1 << 26,
    stdio: ["ignore", "pipe", "inherit"],
  });
  process.stdout.write(parity.stdout ?? "");
  writeFileSync(join(dir, RUN, "parity.txt"), parity.stdout ?? "");
  record.steps.parity = parity.status;
  writeRecord(dir, record);
  console.log(
    `\npin: parity table → ${join(dir, RUN, "parity.txt")} · record → ${join(dir, RECORD)}`,
  );
  process.exitCode = parity.status ?? 1;
}

function remove({ dir: asked }) {
  const dir = canonical(asked);
  const seen = worktrees().get(dir);
  const verdict = removeVerdict({
    registered: seen !== undefined,
    isMain: seen?.main ?? false,
    isSelf: dir === canonical(SELF),
    hasPinRecord: existsSync(join(dir, RECORD)),
  });
  if (!verdict.ok) throw new Error(`pin: refusing to remove ${dir}: ${verdict.why}`);
  git(["worktree", "remove", "--force", dir], SELF);
  git(["worktree", "prune"], SELF);
  console.log(`pin: removed ${dir}`);
}

try {
  const args = pinArgs(process.argv.slice(2));
  if (args.command === "prepare") prepare(args);
  else remove(args);
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
}
