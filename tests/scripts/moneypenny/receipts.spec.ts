import { receiptEventId, routeReceipts } from "../../../scripts/moneypenny/events.mjs";
import { ghRestAll } from "../../../scripts/moneypenny/gh.mjs";

/**
 * THE CLOSE HALF OF THE EVENT-RESEARCH LANE (#2970).
 *
 * The dispatch lane could open a receipt issue but only one thing ever closed one: a merged PR
 * carrying `Closes #N`, read through a GraphQL query capped at 100 issues. By 2026-09-18 that had
 * left 343 open `event-research` issues covering 234 distinct events — 199 of which already had
 * their ledger on `main`, and 35 of which the research horizon (#2946/#2971) had orphaned with no
 * ledger and no way to ever get one. `jobs-2027-11-05`, the event that dispatched the stall-repair
 * session, had THREE open receipts and sits at D-413.
 *
 * These cases pin both closes and — more importantly — the one case that must never close.
 */

type Intent = {
  kind: string;
  issueNumber: number;
  eventId: string;
  body: string;
};

const receipt = (number: number, id: string, hasLedger: boolean) => ({
  number,
  title: `[event-research] ${id}`,
  hasLedger,
});

describe("reading the event id off a receipt title", () => {
  it("takes the id from the title the sweep writes", () => {
    expect(receiptEventId("[event-research] jobs-2027-11-05")).toBe("jobs-2027-11-05");
  });

  it("returns nothing for an issue that is not a receipt, so it is left alone", () => {
    expect(receiptEventId("the login canvas flickers on resize")).toBeUndefined();
    expect(receiptEventId("[plan] the cockpit roadmap")).toBeUndefined();
    expect(receiptEventId(undefined)).toBeUndefined();
  });
});

describe("reconciling receipts against ground truth", () => {
  it("closes a receipt whose ledger is on disk, without needing a Closes # link", () => {
    const intents = routeReceipts({
      openEventReceipts: [receipt(3093, "japan-cpi-2026-09-18", true)],
      dueEventIds: [],
    }) as Intent[];

    expect(intents).toHaveLength(1);
    expect(intents[0]?.kind).toBe("close-researched");
    expect(intents[0]?.issueNumber).toBe(3093);
  });

  it("closes a receipt the horizon orphaned — no ledger, and no longer due", () => {
    const intents = routeReceipts({
      openEventReceipts: [receipt(2970, "jobs-2027-11-05", false)],
      dueEventIds: ["pce-2026-09-30"],
    }) as Intent[];

    expect(intents).toHaveLength(1);
    expect(intents[0]?.kind).toBe("close-obsolete");
    expect(intents[0]?.eventId).toBe("jobs-2027-11-05");
  });

  it("says in the comment that a fresh receipt comes back if the event re-enters the horizon", () => {
    // The whole reason closing is safe rather than lossy. If this sentence goes, the next reader
    // has to re-derive it from the scanner, and "we closed it" reads as "we gave up on it".
    const [intent] = routeReceipts({
      openEventReceipts: [receipt(2970, "jobs-2027-11-05", false)],
    }) as Intent[];

    expect(intent?.body).toContain("never-assessed");
    expect(intent?.body).toContain("fresh receipt");
  });

  it("LEAVES A STILL-DUE RECEIPT ALONE — deferral behind the dispatch cap is not obsolescence", () => {
    // The cap lives downstream of `--due` precisely so this distinction survives (events.mjs).
    // Getting it wrong here would close the queue's live work, which is worse than the pile.
    expect(
      routeReceipts({
        openEventReceipts: [receipt(3200, "pce-2026-09-30", false)],
        dueEventIds: ["pce-2026-09-30"],
      }),
    ).toEqual([]);
  });

  it("ignores an issue that is not a receipt at all", () => {
    expect(
      routeReceipts({
        openEventReceipts: [{ number: 1234, title: "a member's bug report", hasLedger: false }],
        dueEventIds: [],
      }),
    ).toEqual([]);
  });

  it("closes every duplicate receipt for one event, not just the newest", () => {
    // The pile this exists to drain is mostly duplicates: 7 open copies of
    // `fomc-blackout-start-2027-07-17`, 6 of `opex-2028-01-21`, 3 of `jobs-2027-11-05`.
    const intents = routeReceipts({
      openEventReceipts: [
        receipt(2970, "jobs-2027-11-05", false),
        receipt(2824, "jobs-2027-11-05", false),
        receipt(2777, "jobs-2027-11-05", false),
      ],
      dueEventIds: [],
    }) as Intent[];

    expect(intents.map((i) => i.issueNumber)).toEqual([2777, 2824, 2970]);
    expect(intents.every((i) => i.kind === "close-obsolete")).toBe(true);
  });

  it("does nothing on a repo with no open receipts — the common, correct outcome", () => {
    expect(routeReceipts({})).toEqual([]);
  });
});

describe("throttling the drain", () => {
  // Each close is two `gh` mutations on the bucket the 2026-08-26 outage exhausted, and this lands
  // against 343 open receipts. Deferring costs nothing — the sweep is level-based.
  const backlog = Array.from({ length: 100 }, (_, n) => ({
    number: 3000 - n,
    title: `[event-research] ev-${n}`,
    hasLedger: true,
  }));

  it("closes at most one tick's worth and leaves the rest for the next push", () => {
    const intents = routeReceipts({ openEventReceipts: backlog, closesPerTick: 40 });
    expect(intents).toHaveLength(40);
  });

  it("drains oldest first, so the receipts that have been lying longest go first", () => {
    const intents = routeReceipts({ openEventReceipts: backlog, closesPerTick: 3 }) as Intent[];
    expect(intents.map((i) => i.issueNumber)).toEqual([2901, 2902, 2903]);
  });

  it("does not throttle a backlog that fits in one tick", () => {
    const intents = routeReceipts({ openEventReceipts: backlog.slice(0, 5), closesPerTick: 40 });
    expect(intents).toHaveLength(5);
  });
});

describe("paginating a REST list read", () => {
  // The root cause: one `per_page=100` call standing in for 403 open issues. A list that is short
  // but not empty is the subtle half of `gatherDeps`'s fail-closed rule, so the cap must THROW.
  const pager = (total: number) => {
    const all = Array.from({ length: total }, (_, n) => ({ number: n + 1 }));
    return (path: string) => {
      const page = Number(new URL(`https://x/${path}`).searchParams.get("page"));
      return all.slice((page - 1) * 100, page * 100);
    };
  };

  it("walks every page and returns the whole list", () => {
    expect(ghRestAll("issues?state=open", { fetchPage: pager(403) })).toHaveLength(403);
  });

  it("stops on the first short page, so a small repo pays one call", () => {
    const calls: string[] = [];
    const read = pager(12);
    ghRestAll("issues?state=open", {
      fetchPage: (p: string) => {
        calls.push(p);
        return read(p);
      },
    });
    expect(calls).toHaveLength(1);
  });

  it("keeps the caller's own query parameters", () => {
    let seen = "";
    ghRestAll("issues?state=open&labels=event-research", {
      fetchPage: (p: string) => {
        seen = p;
        return [];
      },
    });
    expect(seen).toContain("labels=event-research");
    expect(seen).toContain("per_page=100");
  });

  it("throws rather than truncating when a list outruns the page cap", () => {
    expect(() => ghRestAll("issues?state=open", { fetchPage: pager(5000) })).toThrow(/truncated/);
  });
});
