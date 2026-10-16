import {
  botPlaybooks,
  CARD_WORDS,
  cardFact,
  plainReason,
  playbooksCount,
} from "../../src/live/bot-playbooks";
import {
  entryDateText,
  type Heartbeat,
  type PlaybookHeartbeat,
  type RollCallLine,
} from "../../src/live/heartbeat";

/** Sauron's book on the day #5037's round 2 was drawn: seven playbooks on, BETA-SCOUT off, and
 *  HC-SAURON both "can't fire" on the roll call and "trading on live signals" on the verdict
 *  table — the contradiction one card per playbook exists to end. Reasons are the server's own
 *  sentences (`playbook-window.ts`, `registry.ts`). */
const verdict = (
  playbookId: string,
  state: PlaybookHeartbeat["state"],
  mode = "standard",
): PlaybookHeartbeat => ({
  playbookId,
  mode,
  state,
  since: "2026-10-09T13:31:00Z",
  sinceIsLowerBound: false,
});

const rollCall: RollCallLine[] = [
  {
    playbookId: "S1-NVDA",
    status: "armed",
    mode: "standard",
    reason:
      "On, but the next print date for NVDA (2026-11-18) is an estimate — only a confirmed date opens a position.",
  },
  {
    playbookId: "G1-GOOG",
    status: "armed",
    mode: "standard",
    reason: "On and waiting for its own window to open.",
    nextEntry: "2026-10-27",
  },
  {
    playbookId: "TACO-DJT",
    status: "blocked",
    reason: "No news feed is wired to it yet, so its trigger never arrives.",
  },
  {
    playbookId: "HC-SAURON",
    status: "blocked",
    mode: "standard",
    reason: "Arming it would run a second copy beside the Sauron persona, not replace it (#4227).",
  },
  {
    playbookId: "CRWV-WHEEL",
    status: "armed",
    mode: "aggressive",
    reason: "On, watching for the signal its rule opens on — there is no date to wait for.",
  },
  {
    playbookId: "NVDA-CALL-SPREAD",
    status: "armed",
    mode: "aggressive",
    reason: "On and waiting for its own window to open.",
    nextEntry: "2026-10-21",
  },
  {
    playbookId: "SAURON",
    status: "armed",
    mode: "aggressive",
    reason:
      "On, reading live price and sentiment every pass — there is no date window to wait for.",
  },
  {
    playbookId: "BETA-SCOUT",
    status: "off",
    reason: "Not switched on for this bot — no recorded pass ran it.",
  },
];

const sauron: Heartbeat = {
  state: "beating",
  marketOpen: true,
  lastPassAt: "2026-10-09T19:00:00Z",
  sinceLastPassMs: 20_000,
  cadenceMs: 15_000,
  staleAfterMs: 120_000,
  playbooks: [
    verdict("S1-NVDA", "no-window"),
    verdict("G1-GOOG", "no-window"),
    verdict("HC-SAURON", "tactical"),
    verdict("CRWV-WHEEL", "no-window", "aggressive"),
    verdict("NVDA-CALL-SPREAD", "no-window", "aggressive"),
    verdict("SAURON", "tactical", "aggressive"),
  ],
  rollCall,
};

describe("botPlaybooks — the roll call and the verdict table become one card each", () => {
  it("draws each playbook once, and names an off one only in the footer", () => {
    const { cards, off } = botPlaybooks(sauron);
    const ids = cards.map((c) => c.playbookId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(7);
    expect(ids).not.toContain("BETA-SCOUT");
    expect(off.map((l) => l.playbookId)).toEqual(["BETA-SCOUT"]);
  });

  it("lets can't fire win over the verdict — HC-SAURON never reads as trading", () => {
    const hc = botPlaybooks(sauron).cards.find((c) => c.playbookId === "HC-SAURON");
    expect(hc?.state).toBe("blocked");
    expect(CARD_WORDS[hc?.state ?? "armed"].word).toBe("Can't fire");
  });

  it("lets paused and starts-next-pass win over a verdict too", () => {
    const lines: RollCallLine[] = [
      { playbookId: "S1-NVDA", status: "paused", reason: "Paused: it opens nothing new." },
      { playbookId: "SAURON", status: "starting", reason: "Subscribed and on." },
    ];
    const { cards } = botPlaybooks({ ...sauron, rollCall: lines });
    expect(cards.find((c) => c.playbookId === "S1-NVDA")?.state).toBe("paused");
    expect(cards.find((c) => c.playbookId === "SAURON")?.state).toBe("starting");
  });

  it("counts the line from the cards' own words: 1 trading · 4 waiting · 2 can't fire", () => {
    const { counts } = botPlaybooks(sauron);
    expect(
      counts.map(({ state, count }) => `${count} ${CARD_WORDS[state].counted(count)}`),
    ).toEqual(["1 trading on live signals", "4 waiting for a window", "2 can't fire"]);
  });

  it("orders the cards as the line reads, the waiting ones by soonest window", () => {
    expect(botPlaybooks(sauron).cards.map((c) => c.playbookId)).toEqual([
      "SAURON",
      "NVDA-CALL-SPREAD",
      "G1-GOOG",
      "S1-NVDA",
      "CRWV-WHEEL",
      "TACO-DJT",
      "HC-SAURON",
    ]);
  });

  it("gives every state a glyph of its own — the line never leans on hue", () => {
    const glyphs = Object.values(CARD_WORDS).map((w) => w.glyph);
    expect(new Set(glyphs).size).toBe(glyphs.length);
    expect(CARD_WORDS["no-window"].glyph).toBe("◷");
  });

  // #885: a bot the viewer does not own — no roll call, no ids, one card per verdict.
  it("keeps names off a bot the viewer does not own, even if the payload carried them", () => {
    const { cards, off } = botPlaybooks(sauron, false);
    expect(cards).toHaveLength(6);
    expect(cards.every((c) => c.playbookId === undefined && c.reason === undefined)).toBe(true);
    expect(off).toEqual([]);
    expect(new Set(cards.map((c) => c.key)).size).toBe(6);
  });

  it("reads the wire a non-owner receives: verdicts with no ids and no roll call", () => {
    const { rollCall: _withheld, ...rest } = sauron;
    const anonymous = (sauron.playbooks ?? []).map(({ playbookId: _id, ...v }) => v);
    const { cards } = botPlaybooks({ ...rest, playbooks: anonymous });
    expect(cards.map((c) => c.state)).toEqual([
      "tactical",
      "tactical",
      "no-window",
      "no-window",
      "no-window",
      "no-window",
    ]);
  });

  it("has nothing to draw when no verdict and no roll call came", () => {
    const { rollCall: _none, ...rest } = sauron;
    expect(botPlaybooks({ ...rest, playbooks: null })).toEqual({ cards: [], off: [], counts: [] });
  });
});

describe("cardFact — what a closed card says, and what it opens to", () => {
  const card = (id: string) => botPlaybooks(sauron).cards.find((c) => c.playbookId === id);

  it("leads with the day its own rule next opens a position", () => {
    const fact = cardFact(card("NVDA-CALL-SPREAD") ?? { key: "x", state: "armed" });
    expect(fact.short).toMatch(/^Opens .*21/);
    expect(fact.more).toBe("Waiting for its own window to open.");
  });

  it("cuts the reason at its first dash, and opens to the rest — never the first clause twice", () => {
    expect(cardFact(card("SAURON") ?? { key: "x", state: "armed" })).toEqual({
      short: "Reading live price and sentiment every pass",
      more: "There is no date window to wait for.",
    });
    const s1 = cardFact(card("S1-NVDA") ?? { key: "x", state: "armed" });
    expect(s1.more).toBe("Only a confirmed date opens a position.");
    // The date is said in the reader's own locale, as the card's "Opens …" is ("Nov 18").
    expect(s1.short).toMatch(/^The next print date for NVDA \([^)]*18[^)]*\) is an estimate$/);
    expect(s1.short).not.toContain("2026-11-18");
  });

  it("cuts at a full stop too, and opens to the next sentence", () => {
    expect(
      cardFact({
        key: "x",
        state: "starting",
        reason:
          "Subscribed and on, but no recorded pass has run it yet. It starts on the bot's next pass.",
      }),
    ).toEqual({
      short: "Subscribed and on, but no recorded pass has run it yet",
      more: "It starts on the bot's next pass.",
    });
  });

  it("says a one-clause reason once", () => {
    expect(cardFact(card("TACO-DJT") ?? { key: "x", state: "armed" })).toEqual({
      short: "No news feed is wired to it yet, so its trigger never arrives",
    });
  });

  it("has nothing to say for a non-owner's card — its mode and since speak instead", () => {
    expect(cardFact(botPlaybooks(sauron, false).cards[0] ?? { key: "x", state: "armed" })).toEqual(
      {},
    );
  });
});

describe("plainReason — the card's word already says On or Paused", () => {
  it.each([
    [
      "On, reading live price and sentiment every pass — there is no date window to wait for.",
      "Reading live price and sentiment every pass — there is no date window to wait for.",
    ],
    [
      "On, and its window is open — it wants to hold NVDA.",
      "Its window is open — it wants to hold NVDA.",
    ],
    [
      "On, but no print date is on the calendar for GOOG, so no window can open yet.",
      "No print date is on the calendar for GOOG, so no window can open yet.",
    ],
    [
      "On, with no day inside the next 90 days on which its rule would open a position.",
      "No day inside the next 90 days on which its rule would open a position.",
    ],
    ["On and waiting for its own window to open.", "Waiting for its own window to open."],
    ["Paused: it opens nothing new.", "It opens nothing new."],
    [
      "No news feed is wired to it yet, so its trigger never arrives.",
      "No news feed is wired to it yet, so its trigger never arrives.",
    ],
    [
      "Arming it would run a second copy beside the Sauron persona, not replace it (#4227).",
      "Arming it would run a second copy beside the Sauron persona, not replace it.",
    ],
  ])("%s", (raw, plain) => {
    expect(plainReason(raw)).toBe(plain);
  });

  it("says a calendar day the way the card's own dates do, never as an ISO string", () => {
    expect(plainReason("On, but the next print date for GOOG (2026-10-28) is an estimate.")).toBe(
      `The next print date for GOOG (${entryDateText("2026-10-28")}) is an estimate.`,
    );
  });
});

describe("playbooksCount", () => {
  it("says one playbook, not one playbooks", () => {
    expect(playbooksCount(1)).toBe("1 playbook");
    expect(playbooksCount(7)).toBe("7 playbooks");
  });
});
