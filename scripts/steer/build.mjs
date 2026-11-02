#!/usr/bin/env node
// STEER BUILD — tp.json → one HTML page plus the pictures it publishes beside it (#5056 slice 1).
//
//   node scripts/steer/build.mjs <dir>/tp.json [--out <dir>]
//     writes <dir>/steer.html, <dir>/files.json ({ published path: local file }) and img/…, and for
//     a round's own page its round-input.json, published beside it (round-input.mjs, #6607)
//   Publish: the Artifact tool, file_path steer.html, files from files.json, capabilities
//   { db: {}, user: {}, comments: {} } — all three every time (comments lets Done tell Claude,
//   #5135) — one stable artifact, republished per touch point (.claude/skills/steer).
//
// Ported from the profile critique round's builder (#5037 round 1, a Python script in the session
// scratchpad) and made generic: any number of decisions, three kinds (design · fork · approve),
// each with its estimate and "If you skip", answers keyed by touch point, a Done button, Veto/Bump
// on the queue, Revisit on what shipped, both themes, and pressed states that never rest on hue.
//
// THE IRREVERSIBLE CLASS IS A LINK. A held PR's merge, the surge dial, an envelope path: the page
// links to the GitHub control Eric uses himself and renders no button that could act (criterion 8).
//
// Pictures: a design round's files are copied in; a merged PR's screenshots are read out of git at
// the merge sha (the artifact's CSP serves no outside image, so a raw GitHub URL would not render —
// it stays the link). A shot git cannot produce stays a link, never a broken image.
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { renderPage } from "./render.mjs";
import { builtStamp, decisionPictures, INPUT_FILE, inputToPublish } from "./round-input.mjs";

const flag = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
};

/** Copy every picture tp.json names into `<out>/img/…`; returns the published-path map. */
function collectImages(tp, out) {
  const files = {};
  const put = (published, write) => {
    const dest = join(out, published);
    mkdirSync(dirname(dest), { recursive: true });
    write(dest);
    files[published] = dest;
    return published;
  };
  for (const { pic, published } of decisionPictures(tp)) {
    pic.local = put(published, (dest) => copyFileSync(pic.src, dest));
  }
  // A design round's own page (gather --design-only) has no reel.
  for (const h of tp.reel?.headlines ?? []) {
    for (const s of h.shots.slice(0, 2)) {
      try {
        const bytes = execFileSync("git", ["show", `${s.sha}:${s.path}`], { maxBuffer: 32 << 20 });
        s.local = put(`img/reel/pr-${h.number}-${basename(s.path)}`, (dest) =>
          writeFileSync(dest, bytes),
        );
      } catch {
        s.local = null;
      }
    }
  }
  return files;
}

/** The commit this build drew with; null outside a checkout, which only loses a list of commits. */
function headSha() {
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

function main() {
  const input = process.argv[2];
  if (!input || input.startsWith("--")) throw new Error("usage: build.mjs <tp.json> [--out <dir>]");
  const tp = JSON.parse(readFileSync(input, "utf8"));
  const out = resolve(flag("out") ?? dirname(input));
  mkdirSync(out, { recursive: true });
  const files = collectImages(tp, out);
  const html = renderPage(tp, { img: (pic) => pic.local ?? null });
  writeFileSync(join(out, "steer.html"), html);
  // A round's page carries its own input, so any session can render it again from main (#6607).
  if (tp.designOnly) {
    const built = builtStamp(html, { sha: headSha(), at: new Date().toISOString() });
    files[INPUT_FILE] = join(out, INPUT_FILE);
    writeFileSync(files[INPUT_FILE], `${JSON.stringify(inputToPublish(tp, built), null, 2)}\n`);
  }
  writeFileSync(join(out, "files.json"), `${JSON.stringify(files, null, 2)}\n`);
  console.log(
    `steer.html → ${join(out, "steer.html")} · ${Math.round(html.length / 1024)} KB · ` +
      `${Object.keys(files).length} picture(s) in files.json`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) main();
