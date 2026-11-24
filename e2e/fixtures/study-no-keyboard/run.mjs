// The #8126 proof run, spawned by e2e/study-no-keyboard.spec.ts: the real recorder
// (scripts/study/session.mjs) and the real actor loop (drive.mjs → `play`, the scripted actor) over
// scripts/study/tasks/proof/no-keyboard.html, served from a throwaway local server as a live world
// (scripts/faculty/live-world.mjs: a browser opened on an origin, no built app needed). Prints one
// JSON line: the turns, the trace, the metrics, and what the page ended with.
//
//   node --import tsx e2e/fixtures/study-no-keyboard/run.mjs <phone|desktop> <out dir>

import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { join } from "node:path";
import { play, scriptedActor } from "../../../scripts/study/drive.mjs";
import { taskMetrics } from "../../../scripts/study/metrics.mjs";
import { close, open, readTrace } from "../../../scripts/study/session.mjs";

const PROOF = "scripts/study/tasks/proof";
const [viewport, out] = process.argv.slice(2);
const html = readFileSync(join(PROOF, "no-keyboard.html"));
const server = createServer((_req, res) => {
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(html);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const world = {
  name: "no-keyboard-proof",
  origin: `http://127.0.0.1:${server.address().port}`,
  cookie: "proof",
  pinnedInstant: "2026-11-24T15:00:00Z",
  startPath: "/",
};
const session = await open({ world, viewport, runDir: out });
try {
  const actor = scriptedActor(join(PROOF, "no-keyboard-actions.json"), session);
  const { turns, ended } = await play(session, actor, 8, join(out, "turns.jsonl"));
  const page = {
    ask: await session.page.inputValue("#ask"),
    shortcuts: await session.page.isVisible("#shortcuts"),
  };
  const trace = readTrace(out);
  const { findings: _f, ...metrics } = taskMetrics(trace, { startPath: "/" });
  process.stdout.write(`${JSON.stringify({ turns, ended, trace, metrics, page })}\n`);
} finally {
  await close(session);
  server.close();
}
