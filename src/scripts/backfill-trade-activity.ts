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
import {
  backfillParticipantActivity,
  backfillParticipantOptionLifecycle,
} from "../observatory/activity-backfill.js";
import { createActivityStore } from "../observatory/activity-store.js";
import { mergeRoster } from "../participants/participant.js";
import { createParticipantStore } from "../participants/participant-store.js";
import { resolveDataSource } from "../runtime/data-source.js";
import { detectAndRecordLadderProgress } from "../server/ladder-activity-detector.js";
import { createLadderProgressLogStore } from "../server/ladder-progress-log.js";

async function main(): Promise<void> {
  const dataSource = resolveDataSource(process.env);
  if (dataSource.mode === "offline") {
    console.error(
      "Backfill reads the real broker record — run it in live mode (unset SKYNET_DATA_SOURCE).",
    );
    process.exit(1);
  }

  const roster = mergeRoster(
    dataSource.loadParticipants(),
    createParticipantStore(process.env).load(),
  );
  if (roster.length === 0) {
    console.error("No participants configured — nothing to backfill.");
    process.exit(1);
  }

  const store = createActivityStore(process.env);
  const ladderProgress = createLadderProgressLogStore(process.env);
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
      continue;
    }

    // #468 criterion 6 — option lifecycle events (OPEXP/OPASN/OPEXC/OPTRD) never arrive as order
    // fills, so they need their own sweep of the same durable ledger.
    try {
      const options = dataSource.optionsClientFactory(participant);
      const lifecycle = await backfillParticipantOptionLifecycle({
        participantId: participant.id,
        store,
        listLifecycleActivities: (after) => options.getOptionLifecycleActivities(after),
      });
      console.log(
        `[${participant.id}] ${lifecycle.fetched} option lifecycle activit${lifecycle.fetched === 1 ? "y" : "ies"} read over ${lifecycle.pages} page(s) — ${lifecycle.appended} new ledger line(s), ${lifecycle.fetched - lifecycle.appended} already held.`,
      );
    } catch (error) {
      failures += 1;
      console.error(`[${participant.id}] option lifecycle backfill failed: ${error}`);
    }

    // #469 slice 3 — sweep the ladder milestones this retroactive activity can now prove (an OTM
    // expiry, a first realized profit) so a long-running account doesn't wait on its next live
    // fill to have history it already has get logged.
    try {
      const progress = await detectAndRecordLadderProgress(ladderProgress, store, participant.id);
      if (progress.length > 0) {
        console.log(
          `[${participant.id}] ladder progress: ${progress.map((p) => p.milestoneId).join(", ")}`,
        );
      }
    } catch (error) {
      failures += 1;
      console.error(`[${participant.id}] ladder progress detection failed: ${error}`);
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
