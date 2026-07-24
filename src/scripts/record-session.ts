/**
 * CLI: record a live session to JSONL for later offline replay.
 *
 * Usage:
 *   set -a && source .env && set +a
 *   npm run record:session                       # writes fixtures/offline/recorded.jsonl
 *   npm run record:session -- path/to/out.jsonl  # custom path
 *
 * Runs the real (live) wiring, captures the initial board as a leading `snapshot` event,
 * then appends every price tick and fill as it arrives. Replay it with
 * `SKYNET_OFFLINE_FIXTURES` pointed at a dir whose events.jsonl is this file. Ctrl-C to stop.
 */
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { toEventsJsonl } from "../adapters/replay-event-stream.js";
import { buildDashboardData } from "../observatory/dashboard-data.js";
import type { ObservatoryEvent } from "../observatory/events.js";
import { resolveDataSource } from "../runtime/data-source.js";

async function main(): Promise<void> {
  const outPath = process.argv[2] ?? "fixtures/offline/recorded.jsonl";
  mkdirSync(dirname(outPath), { recursive: true });

  // Force live: recording a fixture-replay would be pointless.
  const dataSource = resolveDataSource({ ...process.env, SKYNET_DATA_SOURCE: "live" });
  const participants = dataSource.loadParticipants();
  if (participants.length === 0) {
    console.error("No participants found. Populate .env first.");
    process.exit(1);
  }

  const initial = await buildDashboardData(participants, {
    clientFactory: dataSource.clientFactory,
  });
  writeFileSync(outPath, `${JSON.stringify({ type: "snapshot", data: initial })}\n`);

  let count = 0;
  const record = (event: ObservatoryEvent): void => {
    appendFileSync(outPath, `${toEventsJsonl([event])}\n`);
    count += 1;
    if (count % 10 === 0) {
      console.log(`[record] ${count} events → ${outPath}`);
    }
  };

  const heldSymbols = [
    ...new Set(initial.participants.flatMap((p) => p.positions.map((pos) => pos.symbol))),
  ];
  dataSource.startStreams({
    participants,
    heldSymbols,
    sink: record,
    onStatus: (channel, status) => console.log(`[${channel}] ${status}`),
  });

  console.log(`Recording live session → ${outPath} (Ctrl-C to stop)`);
  process.on("SIGINT", () => {
    console.log(`\nRecorded ${count} events to ${outPath}.`);
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("Recording failed:", error);
  process.exit(1);
});
