import type { Bot } from "../../src/bots/bot.js";
import type { PlaybookSubscription } from "../../src/domain/types.js";
import type { Persona } from "../../src/personas/persona.js";
import { type AuthoredPlaySpec, authoredRoster } from "../../src/playbooks/authored-play.js";
import { S1_NVDA } from "../../src/playbooks/registry.js";
import { resolveBotRoster } from "../../src/scripts/autonomous-live-wiring.js";

/**
 * A BOT RUNS ITS OWN AUTHORED PLAYS (#4450 slice 3). `subscriptionRoster` could already resolve an
 * authored play; nothing on the bots' side handed it one, so a `U-*` subscription was refused on
 * every bot. These pin the hop `resolveBotRoster` now makes: the author's own bot runs it and
 * pauses it like a house play, and no other bot can.
 */

const spec = (over: Partial<AuthoredPlaySpec> = {}): AuthoredPlaySpec => ({
  slug: "earnings-runup",
  authorAccountId: "futurist",
  authorDisplayName: "Ada",
  symbols: ["AMD"],
  thesis: "long the pre-print drift, out before the dead final week",
  trigger: { kind: "pre-print-window", enterDaysBefore: 20, exitDaysBefore: 6 },
  size: { conservative: 0.01, standard: 0.02, aggressive: 0.03 },
  ...over,
});
const PLAY_ID = "U-futurist-earnings-runup";

const subscribed = (
  accountId: string,
  playbookId: string,
  over: Partial<PlaybookSubscription> = {},
): PlaybookSubscription => ({
  accountId,
  playbookId,
  mode: "standard",
  enabled: true,
  createdAt: "2026-10-09T00:00:00.000Z",
  updatedAt: "2026-10-09T00:00:00.000Z",
  ...over,
});
const quietBot = (id: string): Bot => {
  const persona: Persona = { id, name: id, thesis: "test", decide: () => [] };
  return { persona, credentials: { apiKey: "k", apiSecret: "s" } };
};
const ids = (roster: ReturnType<typeof resolveBotRoster>): string[] =>
  roster.enabled.map((e) => `${e.playbook.id}:${e.mode}${e.exitsOnly ? ":exits-only" : ""}`);

describe("resolveBotRoster with the bot's own authored plays", () => {
  afterEach(() => {
    rstest.restoreAllMocks();
  });

  it("a bot subscribed to its own authored play runs it, beside its house subscriptions", () => {
    const authored = authoredRoster([spec()], "futurist");
    const roster = resolveBotRoster(
      quietBot("futurist"),
      [],
      [subscribed("futurist", "S1-NVDA"), subscribed("futurist", PLAY_ID, { mode: "aggressive" })],
      authored,
    );
    expect(ids(roster)).toEqual(["S1-NVDA:standard", `${PLAY_ID}:aggressive`]);
    expect(roster.enabled[1]?.playbook).toBe(authored.plays[0]);
    expect(roster.enabled[0]?.playbook).toBe(S1_NVDA);
  });

  it("a paused authored play keeps its exits and opens nothing, like a paused house one", () => {
    const roster = resolveBotRoster(
      quietBot("futurist"),
      [],
      [subscribed("futurist", PLAY_ID, { enabled: false })],
      authoredRoster([spec()], "futurist"),
    );
    expect(ids(roster)).toEqual([`${PLAY_ID}:standard:exits-only`]);
  });

  it("another bot's subscription to it is refused — the play never reaches a second book", () => {
    rstest.spyOn(console, "error").mockImplementation(() => undefined);
    const roster = resolveBotRoster(
      quietBot("dragon"),
      [],
      [subscribed("dragon", PLAY_ID)],
      authoredRoster([spec()], "futurist"),
    );
    expect(roster.enabled).toEqual([]);
  });

  it("with no authored roster — what both callers pass today — a U-* subscription is refused", () => {
    rstest.spyOn(console, "error").mockImplementation(() => undefined);
    const roster = resolveBotRoster(quietBot("futurist"), [], [subscribed("futurist", PLAY_ID)]);
    expect(roster.enabled).toEqual([]);
  });

  // The log line is the only place an author learns why their play is dark — the boundary itself.
  it("names the field that keeps an out-of-bounds authored play dark", () => {
    const error = rstest.spyOn(console, "error").mockImplementation(() => undefined);
    resolveBotRoster(
      quietBot("futurist"),
      [],
      [],
      authoredRoster([spec({ symbols: [] })], "futurist"),
    );
    expect(error).toHaveBeenCalledWith(
      expect.stringMatching(
        /futurist's authored play "earnings-runup" is out of bounds — symbols /,
      ),
    );
  });
});
