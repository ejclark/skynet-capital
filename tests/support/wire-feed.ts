import type { ActivityEvent } from "../../src/observatory/activity-event.js";
import type { TradeActivityRecord } from "../../src/observatory/activity-record.js";
import { type WireFeed, wireFeedReader } from "../../src/observatory/wire-feed-cache.js";
import type { FeedbackLogEntry } from "../../src/server/feedback-log.js";

/**
 * A Wire feed over in-memory lists, read through the same fold production wires (#4619). The route
 * has no whole-read fallback any more, so a spec hands its fixtures here: every page it asserts on
 * is then the page the fold serves, not a path no deployment runs. A list left out is an empty leg.
 */
export function wireFeedOf(lists: {
  readonly events?: readonly ActivityEvent[];
  readonly records?: readonly TradeActivityRecord[];
  readonly filings?: readonly FeedbackLogEntry[];
}): () => Promise<WireFeed> {
  const { events = [], records = [], filings = [] } = lists;
  return wireFeedReader({
    bus: { list: async () => [...events] },
    activity: { list: async () => [...records] },
    feedbackLog: { list: async () => [...filings] },
  }).read;
}
