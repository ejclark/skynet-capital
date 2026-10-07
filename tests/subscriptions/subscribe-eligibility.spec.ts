import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import { findPair, type Pair } from "../../src/playbooks/pair-table.js";
import {
  handOffNote,
  newSubscriptionRefusal,
  notTradingNote,
  subscribedPairs,
  takenBy,
} from "../../src/subscriptions/subscribe-eligibility.js";

/**
 * What a NEW subscription needs (#4469 slice 3a, criterion 9), and the promise that it is never
 * asked of a subscription the bot already holds.
 */

const TODAY = "2026-10-07T15:00:00.000Z";
/** The day after S1-NVDA's and the spread's shelf date (2027-03-31). */
const PAST_SHELF = "2027-04-01T15:00:00.000Z";

const pair = (id: string): Pair => {
  const found = findPair(id);
  if (!found) throw new Error(`no pair ${id}`);
  return found;
};

/** A wheel on NVDA — a pair the table does not have yet, for the same-kind checks. */
const WHEEL_NVDA: Pair = { ...pair("CRWV-WHEEL"), id: "NVDA-WHEEL", symbols: ["NVDA"] };
const withWheelNvda = (id: string) => (id === WHEEL_NVDA.id ? WHEEL_NVDA : findPair(id));

const held = (...ids: string[]) => ids.map((playbookId) => ({ playbookId }));

const nvdaPrint = (date: string): EarningsPrint => ({
  symbol: "NVDA",
  date,
  status: "estimate",
  source: "test",
});

describe("a new subscription takes what its pair needs (criterion 9)", () => {
  it("takes S1-NVDA with only an estimated NVDA print on file", () => {
    expect(
      newSubscriptionRefusal({
        playbookId: "S1-NVDA",
        subscriptions: [],
        asOfIso: TODAY,
        prints: [nvdaPrint("2026-11-18")],
      }),
    ).toBeUndefined();
  });

  it("takes the wheel on CRWV, SAURON and the forced pick on a fresh bot", () => {
    for (const playbookId of ["CRWV-WHEEL", "SAURON", "BETA-SCOUT", "HC-SAURON", "G1-GOOG"]) {
      expect(
        newSubscriptionRefusal({ playbookId, subscriptions: [], asOfIso: TODAY }),
        playbookId,
      ).toBeUndefined();
    }
  });

  it("refuses an id nothing resolves, naming it", () => {
    expect(
      newSubscriptionRefusal({ playbookId: "NOPE-1", subscriptions: [], asOfIso: TODAY }),
    ).toBe("No playbook is called NOPE-1.");
  });

  it("takes the caller's own authored play by id", () => {
    expect(
      newSubscriptionRefusal({
        playbookId: "U-acct-mine-runup",
        subscriptions: [],
        asOfIso: TODAY,
        authoredIds: ["U-acct-mine-runup"],
      }),
    ).toBeUndefined();
  });

  it("refuses a pair the bots cannot run yet — the bots learn a pair before the app offers it", () => {
    expect(
      newSubscriptionRefusal({
        playbookId: WHEEL_NVDA.id,
        subscriptions: [],
        asOfIso: TODAY,
        lookup: withWheelNvda,
      }),
    ).toBe("The wheel on NVDA isn't running on the bots yet.");
  });

  it("refuses a date-keyed pair whose ticker has no print on file", () => {
    expect(
      newSubscriptionRefusal({
        playbookId: "NVDA-CALL-SPREAD",
        subscriptions: [],
        asOfIso: TODAY,
        prints: [nvdaPrint("2026-08-26")],
      }),
    ).toBe(
      "The call spread on NVDA needs NVDA's next earnings date on file, and the calendar has none.",
    );
  });

  it("refuses a date-keyed pair with no window a study measured", () => {
    const unmeasured: Pair = {
      ...pair("S1-NVDA"),
      evidence: { ...pair("S1-NVDA").evidence, measuredExit: undefined },
    };
    expect(
      newSubscriptionRefusal({
        playbookId: "S1-NVDA",
        subscriptions: [],
        asOfIso: TODAY,
        lookup: (id) => (id === "S1-NVDA" ? unmeasured : findPair(id)),
      }),
    ).toBe(
      "The pre-print run-up on NVDA has no window a study measured, so it can't take a subscription.",
    );
  });
});

describe("research has a shelf life (criterion 4)", () => {
  it("refuses a new subscription to a ✓ pair the day after its shelf date", () => {
    expect(
      newSubscriptionRefusal({
        playbookId: "S1-NVDA",
        subscriptions: [],
        asOfIso: PAST_SHELF,
        prints: [nvdaPrint("2027-05-26")],
      }),
    ).toBe(
      "The pre-print run-up on NVDA's research ran past its shelf date (2027-03-31); it takes no new subscriptions until it is re-researched.",
    );
  });

  it("still takes it on the shelf date itself, read on the ET market day", () => {
    expect(
      newSubscriptionRefusal({
        playbookId: "S1-NVDA",
        subscriptions: [],
        // 23:30 ET on 2027-03-31 is already 04-01 in UTC.
        asOfIso: "2027-04-01T03:30:00.000Z",
        prints: [nvdaPrint("2027-05-26")],
      }),
    ).toBeUndefined();
  });

  it("never stales a conviction — it carries a check date instead (criterion 12)", () => {
    expect(
      newSubscriptionRefusal({ playbookId: "CRWV-WHEEL", subscriptions: [], asOfIso: PAST_SHELF }),
    ).toBeUndefined();
  });
});

describe("a subscription the bot already holds is never refused (Edit, Pause, Unsubscribe)", () => {
  it("passes Eric's two live subscriptions after every rule this slice turns on", () => {
    for (const playbookId of ["S1-NVDA", "CRWV-WHEEL"]) {
      expect(
        newSubscriptionRefusal({
          playbookId,
          subscriptions: held("S1-NVDA", "CRWV-WHEEL"),
          asOfIso: PAST_SHELF,
          prints: [],
        }),
        playbookId,
      ).toBeUndefined();
    }
  });

  it("passes even an id nothing resolves any more, once it is held", () => {
    expect(
      newSubscriptionRefusal({
        playbookId: "RETIRED-1",
        subscriptions: held("RETIRED-1"),
        asOfIso: TODAY,
      }),
    ).toBeUndefined();
  });
});

describe("a ticker is taken only by a pair of the same kind on the bot", () => {
  it("refuses a second option pair on a ticker an option pair already trades", () => {
    expect(
      newSubscriptionRefusal({
        playbookId: WHEEL_NVDA.id,
        subscriptions: held("NVDA-CALL-SPREAD"),
        asOfIso: TODAY,
        lookup: withWheelNvda,
        runnable: () => true,
      }),
    ).toBe(
      "The call spread already trades NVDA options on this bot; a bot runs one option playbook per symbol.",
    );
  });

  it("takes an option pair over a share pair, and a share pair beside an option pair", () => {
    expect(
      newSubscriptionRefusal({
        playbookId: "NVDA-CALL-SPREAD",
        subscriptions: held("S1-NVDA"),
        asOfIso: TODAY,
      }),
    ).toBeUndefined();
    expect(
      newSubscriptionRefusal({
        playbookId: "S1-NVDA",
        subscriptions: held("NVDA-CALL-SPREAD"),
        asOfIso: TODAY,
      }),
    ).toBeUndefined();
  });

  it("never takes a ticker from, or for, a basket", () => {
    expect(takenBy(pair("HC-SAURON"), [pair("S1-NVDA")])).toBeUndefined();
    expect(takenBy(pair("S1-NVDA"), [pair("HC-SAURON"), pair("SAURON")])).toBeUndefined();
  });
});

describe("what the Store draws on a subscribed row", () => {
  it("names today's hand-off on a share pair whose ticker an option pair takes", () => {
    expect(handOffNote(pair("S1-NVDA"), [pair("S1-NVDA"), pair("NVDA-CALL-SPREAD")])).toBe(
      "The call spread trades NVDA on this bot; the pre-print run-up yields it.",
    );
    expect(handOffNote(pair("HC-SAURON"), [pair("NVDA-CALL-SPREAD")])).toBe(
      "The call spread trades NVDA on this bot; hardcore Sauron's tactics yields it.",
    );
  });

  it("draws no hand-off where nothing yields", () => {
    expect(handOffNote(pair("S1-NVDA"), [pair("CRWV-WHEEL")])).toBeUndefined();
    expect(handOffNote(pair("NVDA-CALL-SPREAD"), [pair("S1-NVDA")])).toBeUndefined();
  });

  it("says which option pair is not trading, first in the bot's order owning the ticker", () => {
    const onBot = [pair("NVDA-CALL-SPREAD"), WHEEL_NVDA];
    expect(notTradingNote(WHEEL_NVDA, onBot)).toBe("not trading — the call spread owns NVDA");
    expect(notTradingNote(pair("NVDA-CALL-SPREAD"), onBot)).toBeUndefined();
  });

  it("reads the bot's pairs in the bot's order — enabled first, then paused", () => {
    const lookup = withWheelNvda;
    const onBot = subscribedPairs(
      [
        { playbookId: "NVDA-CALL-SPREAD", enabled: false },
        { playbookId: WHEEL_NVDA.id, enabled: true },
      ],
      lookup,
    );
    expect(onBot.map((p) => p.id)).toEqual([WHEEL_NVDA.id, "NVDA-CALL-SPREAD"]);
    expect(notTradingNote(pair("NVDA-CALL-SPREAD"), onBot)).toBe(
      "not trading — the wheel owns NVDA",
    );
  });
});

describe("the bots app's own roster holds tickers too (#4469 slice 3a part 2)", () => {
  const lookup = withWheelNvda;

  it("reads the env-named ids first, in their order, and a subscription keeps that turn", () => {
    const onBot = subscribedPairs(
      [
        { playbookId: WHEEL_NVDA.id, enabled: true },
        { playbookId: "NVDA-CALL-SPREAD", enabled: true },
      ],
      lookup,
      ["NVDA-CALL-SPREAD", "S1-NVDA"],
    );
    expect(onBot.map((p) => p.id)).toEqual(["NVDA-CALL-SPREAD", "S1-NVDA", WHEEL_NVDA.id]);
  });

  it("refuses a second option pair on a ticker the env roster's option pair holds, unsubscribed", () => {
    expect(
      newSubscriptionRefusal({
        playbookId: WHEEL_NVDA.id,
        subscriptions: [],
        envNamed: ["NVDA-CALL-SPREAD"],
        asOfIso: TODAY,
        lookup,
        runnable: () => true,
      }),
    ).toBe(
      "The call spread already trades NVDA options on this bot; a bot runs one option playbook per symbol.",
    );
  });

  it("takes the env-named pair itself — subscribing it is what arms it", () => {
    expect(
      newSubscriptionRefusal({
        playbookId: "NVDA-CALL-SPREAD",
        subscriptions: [],
        envNamed: ["NVDA-CALL-SPREAD"],
        asOfIso: TODAY,
      }),
    ).toBeUndefined();
  });

  it("says the later option pair is not trading when the env roster's owns the ticker", () => {
    const onBot = subscribedPairs([{ playbookId: WHEEL_NVDA.id, enabled: true }], lookup, [
      "NVDA-CALL-SPREAD",
    ]);
    expect(notTradingNote(WHEEL_NVDA, onBot)).toBe("not trading — the call spread owns NVDA");
  });

  it("is unchanged when the bots reported no roster", () => {
    expect(
      subscribedPairs([{ playbookId: "S1-NVDA", enabled: true }], lookup).map((p) => p.id),
    ).toEqual(["S1-NVDA"]);
  });
});
