/**
 * CLI: one-time retroactive translation of the two existing durable ledgers into the unified
 * activity event bus (#1211 slice 1).
 *
 * Reads every line ever journaled to `SKYNET_ACTIVITY_DIR` (trade fills/lifecycle) and
 * `SKYNET_ORDER_AUDIT_DIR` (order submissions), translates each into an `ActivityEvent`, and
 * publishes it onto the bus. Idempotent: a line whose translated id the bus already holds is
 * skipped, so re-running (or running after the live decorators have already published newer lines)
 * appends nothing twice.
 *
 * Usage:
 *   set -a && source .env && set +a
 *   npm run backfill:activity-events
 */

import { createActivityEventBus } from "../observatory/activity-bus.js";
import {
  activityEventFromAuditRecord,
  activityEventFromTradeRecord,
} from "../observatory/activity-event.js";
import { createActivityStore } from "../observatory/activity-store.js";
import { createOrderAuditLog } from "../server/order-audit-log.js";

async function main(): Promise<void> {
  const bus = createActivityEventBus(process.env);
  const known = new Set((await bus.list()).map((e) => e.id));
  let published = 0;
  let skipped = 0;

  const activityStore = createActivityStore(process.env);
  for (const record of await activityStore.list()) {
    const event = activityEventFromTradeRecord(record);
    if (known.has(event.id)) {
      skipped += 1;
      continue;
    }
    await bus.publish(event);
    known.add(event.id);
    published += 1;
  }

  const orderAuditLog = createOrderAuditLog(process.env);
  for (const record of await orderAuditLog.list()) {
    const event = activityEventFromAuditRecord(record);
    if (known.has(event.id)) {
      skipped += 1;
      continue;
    }
    await bus.publish(event);
    known.add(event.id);
    published += 1;
  }

  console.log(`Backfilled ${published} event(s) onto the activity bus, ${skipped} already held.`);
}

main().catch((error) => {
  console.error("Activity-event backfill failed:", error);
  process.exit(1);
});
