import {
  type ActivityFeedItem,
  buildActivityFeed,
  filingsInScope,
  matchesActivity,
  parseActivityQuery,
  toggleActivityQualifier,
} from "../../src/live/activity-feed";
import type { WireFeedbackItem, WireTrade } from "../../src/live/wire";

/**
 * ONE FEED, SEVERAL KINDS (#784 slice 3) — the page's own model. Behavioral only: given a query a
 * member could type or click, which events are on the list and in what order.
 *
 * The slice's falsifier is pinned here: "a kind filter hides an event that is actually of that
 * kind". Each filter rule gets the positive case AND the case where it must NOT hide something.
 */

const trade = (over: Partial<WireTrade> = {}): WireTrade => ({
  key: `t-${over.symbol ?? "NVDA"}-${over.at ?? "1"}`,
  side: "buy",
  symbol: "NVDA",
  quantity: 10,
  price: "$176.42",
  who: "Sauron",
  whoId: "sauron",
  kind: "bot",
  reconstructed: false,
  when: "2:30p",
  at: "2026-10-01T18:30:00.000Z",
  ...over,
});

const filing = (over: Partial<WireFeedbackItem> = {}): WireFeedbackItem => ({
  issueNumber: 4271,
  icon: "🗺️",
  kindLabel: "Idea",
  title: "One feed, not three widgets",
  url: "https://github.com/ejclark/skynet-capital/issues/4271",
  meta: "#4271 · 10/1/2026",
  at: "2026-10-01T12:00:00.000Z",
  ...over,
});

const keys = (items: readonly ActivityFeedItem[]) => items.map((i) => i.key);
const show = (items: readonly ActivityFeedItem[], query: string) =>
  items.filter((item) => matchesActivity(item, parseActivityQuery(query)));

describe("buildActivityFeed", () => {
  it("interleaves both kinds newest first, on the raw instant rather than the formatted one", () => {
    const feed = buildActivityFeed(
      [trade({ at: "2026-10-01T09:00:00.000Z", key: "t-early" })],
      [filing({ at: "2026-10-01T15:00:00.000Z" })],
    );
    expect(keys(feed)).toEqual(["filing:4271", "t-early"]);
  });

  it("survives a server that doesn't send `at` yet, rather than throwing mid-render", () => {
    // The field is new in this slice; a new bundle can reach an old server for the length of a
    // rolling deploy. Sorting `undefined` would white-screen the page — this sorts it last.
    const stale = { ...trade({ key: "t-stale" }), at: undefined } as unknown as WireTrade;
    const feed = buildActivityFeed([stale, trade({ key: "t-fresh" })], [filing()]);
    expect(keys(feed)).toEqual(["t-fresh", "filing:4271", "t-stale"]);
  });

  it("orders two events that share an instant deterministically, so a re-render never reshuffles", () => {
    const at = "2026-10-01T18:30:00.000Z";
    const first = buildActivityFeed([trade({ key: "t-b", at }), trade({ key: "t-a", at })], []);
    const second = buildActivityFeed([trade({ key: "t-a", at }), trade({ key: "t-b", at })], []);
    expect(keys(first)).toEqual(keys(second));
  });
});

describe("the kind facets", () => {
  const feed = buildActivityFeed([trade({ key: "t-1" })], [filing()]);

  it("shows both kinds with no filter at all", () => {
    expect(keys(show(feed, ""))).toEqual(["t-1", "filing:4271"]);
  });

  it("is:trade keeps every trade and drops filings", () => {
    expect(keys(show(feed, "is:trade"))).toEqual(["t-1"]);
  });

  it("is:feedback keeps every filing and drops trades", () => {
    expect(keys(show(feed, "is:feedback"))).toEqual(["filing:4271"]);
  });

  it("never hides an event of the kind that was asked for — the slice's own falsifier", () => {
    const many = buildActivityFeed(
      [trade({ key: "t-1", side: "sell", kind: "human" }), trade({ key: "t-2" })],
      [filing(), filing({ issueNumber: 99, statusKey: "needs-info", status: "Needs info" })],
    );
    expect(show(many, "is:trade")).toHaveLength(2);
    expect(show(many, "is:feedback")).toHaveLength(2);
  });
});

describe("the trade-only facets", () => {
  const feed = buildActivityFeed(
    [trade({ key: "t-buy" }), trade({ key: "t-sell", side: "sell", kind: "human" })],
    [filing()],
  );

  it("narrows the feed to trades, because a filing has no side", () => {
    expect(keys(show(feed, "is:buy"))).toEqual(["t-buy"]);
  });

  it("narrows the feed to trades for a desk facet too, because a filing has no desk", () => {
    expect(keys(show(feed, "is:human"))).toEqual(["t-sell"]);
  });

  it("hides the filings control while the feed is narrowed to trades", () => {
    expect(filingsInScope(parseActivityQuery("is:buy"))).toBe(false);
    expect(filingsInScope(parseActivityQuery("is:trade"))).toBe(false);
    expect(filingsInScope(parseActivityQuery(""))).toBe(true);
    expect(filingsInScope(parseActivityQuery("is:feedback"))).toBe(true);
  });
});

describe("the open/shipped separation", () => {
  const feed = buildActivityFeed(
    [trade({ key: "t-1" })],
    [
      filing({ issueNumber: 1, statusKey: "shipped", status: "Shipped" }),
      filing({ issueNumber: 2, statusKey: "open", status: "In the queue" }),
      filing({ issueNumber: 3 }),
    ],
  );

  it("leaves shipped filings out by default — a record, not something still moving", () => {
    expect(keys(show(feed, ""))).toEqual(["t-1", "filing:2", "filing:3"]);
  });

  it("brings them in on show:shipped", () => {
    expect(show(feed, "show:shipped")).toHaveLength(4);
  });

  it("never hides a trade — there is no shipped trade", () => {
    expect(keys(show(feed, "is:trade"))).toEqual(["t-1"]);
  });

  it("keeps a filing whose status nobody has observed, rather than reading absent as shipped", () => {
    expect(keys(show(feed, "is:feedback"))).toContain("filing:3");
  });
});

describe("a bare search term", () => {
  const feed = buildActivityFeed([trade({ key: "t-1" })], [filing()]);

  it("matches a trade by symbol or trader and a filing by title", () => {
    expect(keys(show(feed, "nvda"))).toEqual(["t-1"]);
    expect(keys(show(feed, "sauron"))).toEqual(["t-1"]);
    expect(keys(show(feed, "widgets"))).toEqual(["filing:4271"]);
  });

  it("matches a filing by its issue number, pasted with or without the hash", () => {
    expect(keys(show(feed, "#4271"))).toEqual(["filing:4271"]);
    expect(keys(show(feed, "4271"))).toEqual(["filing:4271"]);
  });
});

describe("toggleActivityQualifier", () => {
  it("replaces a sibling rather than stacking a contradiction", () => {
    expect(toggleActivityQualifier("is:trade", "is:feedback")).toBe("is:feedback");
    expect(toggleActivityQualifier("is:buy nvda", "is:sell")).toBe("nvda is:sell");
  });

  it("turns a pressed chip back off", () => {
    expect(toggleActivityQualifier("nvda is:feedback", "is:feedback")).toBe("nvda");
  });

  it("treats show:shipped as a flag in no group, so it survives a kind change within its kind", () => {
    expect(toggleActivityQualifier("show:shipped", "is:feedback")).toBe("show:shipped is:feedback");
  });

  it("clears the other kind's tokens, so a chip that unmounts can never strand one", () => {
    // Pressing Ideas while Buys is on: the Side group is no longer rendered, so `is:buy` would
    // otherwise be inert AND unreachable — removable only by hand-editing the filter box.
    expect(toggleActivityQualifier("is:buy", "is:feedback")).toBe("is:feedback");
    expect(toggleActivityQualifier("is:bot is:sell", "is:feedback")).toBe("is:feedback");
    // And the mirror: pressing Trades drops the filings flag, whose chip goes with it.
    expect(toggleActivityQualifier("show:shipped", "is:trade")).toBe("is:trade");
    expect(toggleActivityQualifier("is:feedback show:shipped", "is:buy")).toBe("is:buy");
  });

  it("never clears a bare search term — NVDA still means NVDA whichever kind is up", () => {
    expect(toggleActivityQualifier("nvda is:buy", "is:feedback")).toBe("nvda is:feedback");
  });
});

describe("parseActivityQuery", () => {
  it("splits known qualifiers from bare terms and ignores case", () => {
    expect(parseActivityQuery("NVDA IS:SELL show:shipped")).toEqual({
      terms: ["nvda"],
      qualifiers: ["is:sell", "show:shipped"],
    });
  });

  it("treats an unknown is:-looking token as a plain term, never as a silent filter", () => {
    expect(parseActivityQuery("is:milestone")).toEqual({ terms: ["is:milestone"], qualifiers: [] });
  });
});
