/**
 * CLI: one-time retroactive capture of trade history into the durable activity ledger.
 *
 * Pages every participant's FULL order history out of Alpaca (which keeps the whole record even
 * though the dashboard only reads a recent window) and journals it under `SKYNET_ACTIVITY_DIR`.
 * Idempotent: re-running appends nothing the ledger already holds, so it doubles as a manual
 * reconcile after any long dashboard outage.
 *
 * Usage:
 *   set -a && source .env && set +a
 *   npm run backfill:activity
 */
import { backfillParticipantActivity } from "../observatory/activity-backfill.js";
import { createActivityStore } from "../observatory/activity-store.js";
import { dedupeById } from "../participants/participant.js";
import { createParticipantStore } from "../participants/participant-store.js";
import { resolveDataSource } from "../runtime/data-source.js";

async function main(): Promise<void> {
  const dataSource = resolveDataSource(process.env);
  if (dataSource.mode === "offline") {
    console.error(
      "Backfill reads the real broker record — run it in live mode (unset SKYNET_DATA_SOURCE).",
    );
    process.exit(1);
  }

  const roster = dedupeById([
    ...dataSource.loadParticipants(),
    ...createParticipantStore(process.env).load(),
  ]);
  if (roster.length === 0) {
    console.error("No participants configured — nothing to backfill.");
    process.exit(1);
  }

  const store = createActivityStore(process.env);
  console.log(
    `Backfilling order history for ${roster.length} participant(s) into ${process.env.SKYNET_ACTIVITY_DIR ?? "data/activity"}…`,
  );

  let failures = 0;
  for (const participant of roster) {
    const client = dataSource.clientFactory(participant);
    try {
      const result = await backfillParticipantActivity({
        participantId: participant.id,
        store,
        listOrders: (params) => client.listOrders(params),
      });
      console.log(
        `[${participant.id}] ${result.fetched} order(s) read over ${result.pages} page(s) — ${result.appended} new ledger line(s), ${result.fetched - result.appended} already held.`,
      );
    } catch (error) {
      failures += 1;
      console.error(`[${participant.id}] backfill failed: ${error}`);
    }
  }

  if (failures > 0) {
    console.error(`${failures} participant(s) failed — fix credentials and re-run (idempotent).`);
    process.exit(1);
  }
  console.log("Backfill complete. The trade history tab now reads the full record.");
}

main().catch((error) => {
  console.error("Backfill failed:", error);
  process.exit(1);
});
