// A FROZEN copy of the offline fixtures for the journeys — the roster as committed, and no
// `events.jsonl`, so nothing replays. `SKYNET_DATA_SOURCE=offline` normally replays the recorded
// fill script one tick a second from boot (src/adapters/replay-event-stream.ts), which is right
// for a demo and wrong for an acceptance test: run 0 watched Eric's one EEM position get closed
// by the replay between two steps of the same journey, so "the member holds EEM" was true or
// false depending on the second the step ran. A test that flips with the clock is not a test.
//
// The copy is made in a temp dir at boot (`SKYNET_OFFLINE_FIXTURES` points the server at it —
// src/runtime/data-source.ts:185), so `fixtures/offline/participants.json` is read, never
// touched, and no second copy of the roster lives in the tree to drift.

import { copyFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** @returns {string} a directory holding `participants.json` only. */
export function frozenFixturesDir(source = join("fixtures", "offline")) {
  const dir = mkdtempSync(join(tmpdir(), "skynet-journeys-fixtures-"));
  copyFileSync(join(source, "participants.json"), join(dir, "participants.json"));
  return dir;
}
