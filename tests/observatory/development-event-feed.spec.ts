import {
  type ActivityEvent,
  activityEventFromMergedPullRequest,
  activityEventFromTradeRecord,
  type MergedPullRequestInfo,
} from "../../src/observatory/activity-event.js";
import {
  collapseDevelopmentEvents,
  developmentFromEvent,
  mergeMergesIntoEvents,
} from "../../src/observatory/development-event-feed.js";

/**
 * The read half of #784's third kind (slice 4) — given envelopes, what has the league shipped? The
 * decoder's contract matches its two siblings': a mixed bus is the normal input, a payload that cannot
 * honestly yield a row is dropped rather than defaulted, and the fold keys on the thing's own identity.
 */
const merge = (over: Partial<MergedPullRequestInfo> = {}): MergedPullRequestInfo => ({
  number: 4272,
  title: "feat(activity): development events for merged PRs",
  author: "claude",
  url: "https://github.com/ejclark/skynet-capital/pull/4272",
  mergedAt: "2026-10-02T12:00:00.000Z",
  ...over,
});

const tradeEvent = activityEventFromTradeRecord({
  orderId: "ord-1",
  participantId: "sauron",
  symbol: "NVDA",
  side: "buy",
  quantity: 10,
  filledQuantity: 10,
  status: "filled",
  at: "2026-10-02T14:00:00.000Z",
  source: "stream",
});

describe("developmentFromEvent", () => {
  it("decodes a merged pull request off the envelope", () => {
    expect(developmentFromEvent(activityEventFromMergedPullRequest(merge()))).toEqual({
      pullRequest: 4272,
      title: "feat(activity): development events for merged PRs",
      author: "claude",
      url: "https://github.com/ejclark/skynet-capital/pull/4272",
      mergedAt: "2026-10-02T12:00:00.000Z",
    });
  });

  it("returns null for another kind's event — a mixed bus is the normal input, not an error", () => {
    expect(developmentFromEvent(tradeEvent)).toBeNull();
  });

  it("leaves the author absent rather than naming someone the payload did not", () => {
    const decoded = developmentFromEvent(
      activityEventFromMergedPullRequest(merge({ author: undefined })),
    );

    expect(decoded).not.toBeNull();
    expect(decoded).not.toHaveProperty("author");
  });

  it("drops an event whose payload cannot say what merged or where to read it", () => {
    const base = activityEventFromMergedPullRequest(merge());
    const without = (payload: Record<string, unknown>): ActivityEvent => ({ ...base, payload });

    expect(developmentFromEvent(without({ pullRequest: 4272, url: base.payload.url }))).toBeNull();
    expect(
      developmentFromEvent(without({ pullRequest: 4272, title: base.payload.title })),
    ).toBeNull();
  });

  it("drops an owner-only line, so a narrower tier never leaks onto the cross-member feed", () => {
    const owned: ActivityEvent = {
      ...activityEventFromMergedPullRequest(merge()),
      visibility: "owner-only",
    };

    expect(developmentFromEvent(owned)).toBeNull();
  });

  it("drops an event typed as a merge but targeting something else", () => {
    const mistyped: ActivityEvent = {
      ...activityEventFromMergedPullRequest(merge()),
      target: { kind: "order", id: "ord-1" },
    };

    expect(developmentFromEvent(mistyped)).toBeNull();
  });
});

describe("collapseDevelopmentEvents", () => {
  it("folds a mixed bus into one row per pull request, newest merge first", () => {
    const events = [
      tradeEvent,
      activityEventFromMergedPullRequest(
        merge({ number: 1, mergedAt: "2026-10-01T00:00:00.000Z" }),
      ),
      activityEventFromMergedPullRequest(
        merge({ number: 2, mergedAt: "2026-10-03T00:00:00.000Z" }),
      ),
    ];

    expect(collapseDevelopmentEvents(events).map((m) => m.pullRequest)).toEqual([2, 1]);
  });

  it("a merge published twice is one row — the event id is the PR number, so a replay cannot duplicate it", () => {
    const events = [
      activityEventFromMergedPullRequest(merge()),
      activityEventFromMergedPullRequest(merge()),
    ];

    expect(collapseDevelopmentEvents(events)).toHaveLength(1);
  });
});

describe("mergeMergesIntoEvents", () => {
  it("folds a just-polled merge in, so a render is never one request behind its own emitter", () => {
    const folded = mergeMergesIntoEvents([tradeEvent], [merge()]);

    expect(collapseDevelopmentEvents(folded).map((m) => m.pullRequest)).toEqual([4272]);
  });

  it("a merge already on the bus still folds to one row", () => {
    const published = [activityEventFromMergedPullRequest(merge())];

    expect(collapseDevelopmentEvents(mergeMergesIntoEvents(published, [merge()]))).toHaveLength(1);
  });
});
