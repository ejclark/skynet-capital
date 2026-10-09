// THE COMPOSER (#4943 slice 2) — every server-derived payload a study world serves, produced by
// the checked-out tree's own code, once per commit, into a run directory with a sha256 each.
//
//   npx tsx scripts/study/worlds/compose.mjs <run-dir> [world …]   # default: every world
//
// HOW: each world's book (book.mjs, from inputs/*.json) becomes the server's own config
// (server-config.mjs, with market.mjs's options client), and every read a viewer's page makes is
// answered by the REAL route handler, called with that viewer's session (../server-reads.mjs —
// the server's own dispatch order). So the payloads come out of the real pure builders —
// `deskView` (which runs `considerationsFor` and `decisionsFor`), `botHeartbeatView`,
// `deskActivityView`, `accountsNetWorthView`, `deskPulseView`, `thesisView`, the guidance and
// option-position views — AND through the real gates: a non-owner's copy of a bot loses its
// playbooks because `desk-owner-gate.ts` strips them, never because a fixture left them out. Built
// from the same worktree as the `app/dist` under test, a fixed build's server-side fixes show up
// in its world.
//
// THE CLOCK AND THE NETWORK, BEFORE ANY SERVER CODE LOADS: the process `Date` is pinned to INSTANT
// and `fetch` is replaced by the world's own answers (../no-network.mjs) first, and only then is
// `src/` imported (dynamically, below). Order matters: a module that captures `Date.now` when it
// loads — the guidance route's EDGAR client does — would otherwise keep the wall clock. TZ is UTC
// as on the deployed server. Two composes of one commit hash identically.
//
// ENDPOINTS WITH NO PURE BUILDER: none today — every read the profile pages make is claimed by a
// real handler. A world's `fixtures` hook (fixtures.mjs) is where one would go, recorded in the
// manifest as `fixture: <why>`. A read neither answers is MISSING and the composer exits non-zero:
// a world never ships a hole it did not declare.

process.env.TZ = "UTC";

import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { guardNetwork } from "../no-network.mjs";
import { canonicalUrl, writeViewer } from "../payloads.mjs";
import { edgarAnswer, loadInput } from "./inputs.mjs";
import { INSTANT, pinProcessClock } from "./instant.mjs";

/** Compose one world into `<runDir>/<world>/`; returns its manifest rows and any missing reads. */
async function composeWorld(world, runDir, server) {
  const book = server.buildBook(world.input);
  const config = server.serverConfig(book);
  const channel = server.createBoardChannel();
  const fixtures = world.fixtures(book);
  const manifest = [];
  const missing = [];
  for (const [viewer, email] of Object.entries(world.viewers)) {
    const session = server.sessionFor(email);
    const answers = [];
    for (const url of world.reads(viewer)) {
      const fixture = fixtures(url, viewer);
      if (fixture !== undefined) {
        answers.push({ url, status: 200, body: fixture.body, source: `fixture: ${fixture.why}` });
        continue;
      }
      const real = await server.serverRead(url, config, channel, session);
      if (real) answers.push({ url, ...real, source: "builder" });
      else missing.push(`${world.name}/${viewer} ${canonicalUrl(url)}`);
    }
    manifest.push(...writeViewer(join(runDir, world.name), viewer, answers));
  }
  return { manifest, missing };
}

async function main() {
  const [runDirArg, ...names] = process.argv.slice(2);
  if (!runDirArg) {
    console.error("usage: compose.mjs <run-dir> [world …]");
    process.exit(2);
  }
  const runDir = resolve(runDirArg);
  mkdirSync(runDir, { recursive: true });
  pinProcessClock();
  let edgar = () => undefined;
  const network = guardNetwork((url) => edgar(url));
  const { WORLDS } = await import("./index.mjs");
  const server = {
    ...(await import("./book.mjs")),
    ...(await import("./server-config.mjs")),
    ...(await import("../server-reads.mjs")),
    ...(await import("../../../src/server/board-patch-routes.ts")),
  };
  const chosen = names.length > 0 ? WORLDS.filter((w) => names.includes(w.name)) : WORLDS;
  const payloads = [];
  const missing = [];
  for (const world of chosen) {
    edgar = edgarAnswer(loadInput(world.input));
    const result = await composeWorld(world, runDir, server);
    payloads.push(...result.manifest.map((row) => ({ world: world.name, ...row })));
    missing.push(...result.missing);
  }
  const manifest = {
    instant: INSTANT,
    worlds: chosen.map((w) => w.name),
    network: { answered: [...new Set(network.answered)], refused: [...new Set(network.refused)] },
    payloads,
  };
  writeFileSync(join(runDir, "manifest.json"), `${JSON.stringify(manifest, null, 1)}\n`);
  const fixtures = payloads.filter((r) => r.source.startsWith("fixture")).length;
  console.log(
    `compose: ${payloads.length} payloads (${payloads.length - fixtures} builder, ${fixtures} fixture)` +
      ` · network refused ${manifest.network.refused.length} → ${runDir}`,
  );
  if (missing.length > 0) {
    console.error(`compose: ${missing.length} read(s) nothing answers:\n  ${missing.join("\n  ")}`);
    process.exitCode = 1;
  }
}

await main();
