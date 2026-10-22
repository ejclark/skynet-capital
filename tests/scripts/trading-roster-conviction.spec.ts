import type { Bot } from "../../src/bots/bot.js";
import type { Portfolio } from "../../src/domain/types.js";
import type { Persona } from "../../src/personas/persona.js";
import { CRWV_WHEEL } from "../../src/playbooks/registry.js";
import type { ConvictionGateDeps } from "../../src/playbooks/with-conviction-gate.js";
import { resolveBotRoster, tradingRoster } from "../../src/scripts/autonomous-live-wiring.js";
import { buildOccSymbol } from "../../src/trading/option-symbols.js";
import {
  aContext,
  anOptionQuote,
  aPortfolio,
  aSubscription,
  withOptionQuotes,
} from "../support/builders.js";
import { aMemberConviction } from "../support/member-conviction.js";

/**
 * #4469 criterion 12 on the live wiring: the gate sits inside `tradingRoster`, so the wheel's put
 * stops on a failed conviction check on the same path the bots trade — and only that put.
 */

const ASOF = "2026-11-18T16:00:00Z";
const stub = (id: string): Persona => ({ id, name: id, thesis: "n/a", decide: () => [] });
const bot: Bot = { persona: stub("sauron"), credentials: { apiKey: "k", apiSecret: "s" } };
const put = (strike: number) =>
  buildOccSymbol({ underlying: "CRWV", expiration: "2026-12-31", type: "put", strike });
const market = () =>
  withOptionQuotes(
    aContext({ CRWV: { last: 92 } }, ASOF),
    [
      anOptionQuote(put(75), { bid: 1.65, ask: 1.85, delta: -0.15, openInterest: 500, at: ASOF }),
      anOptionQuote(put(80), { bid: 2.2, ask: 2.4, delta: -0.21, openInterest: 500, at: ASOF }),
    ],
    { CRWV: ["2026-11-20", "2026-12-18", "2026-12-31", "2027-01-15"] },
  );
const flat = (): Portfolio => aPortfolio({ cash: 100_000, positions: [] });
const conviction = { reason: "my call", checkOn: "2026-11-18" };

const roster = (ledgerOf?: ConvictionGateDeps["ledgerOf"]) =>
  tradingRoster(
    {
      bot,
      subscriptions: [aSubscription("sauron", "CRWV-WHEEL", { conviction })],
      enabled: [{ playbook: CRWV_WHEEL, mode: "standard" }],
    },
    { maxPositionPct: 0.03 },
    undefined,
    ledgerOf ? { ledgerOf } : {},
  );

describe("tradingRoster — the conviction gate on the live path", () => {
  const sold = (r: ReturnType<typeof roster>) =>
    r.persona.decide(market(), flat()).filter((i) => i.playbookId === "CRWV-WHEEL");

  it("sells the wheel's put when the check passes", () => {
    const r = roster(() => ({ realizedPl: 230, putsClosed: 0, putsAssigned: 0 }));
    expect(sold(r)).toHaveLength(1);
  });

  it("sells nothing new once the check fails — and the roster still carries expiry hygiene", () => {
    const r = roster(() => ({ realizedPl: -10, putsClosed: 0, putsAssigned: 0 }));
    expect(sold(r)).toEqual([]);
    expect(r.persona.optionDemand).toBeDefined();
  });
});

/**
 * #5482 slice 6c: a member's handed-over view reaches a bot as its roster's `convictionOf`, and the
 * narrowing the roster was built with and the check the gate reads come from that one lookup.
 */
describe("a bot's rosters under a member's view", () => {
  const view = aMemberConviction({ checkOn: "2026-11-18" });
  const lookup = (id: string) => (id === view.id ? view : undefined);
  const pointed = [aSubscription("sauron", "CRWV-WHEEL", { convictionId: view.id })];
  const silence = { log: console.log, error: console.error, warn: console.warn };
  beforeEach(() => {
    console.log = () => undefined;
    console.error = () => undefined;
    console.warn = () => undefined;
  });
  afterEach(() => {
    Object.assign(console, silence);
  });

  it("narrows the pair the view steers, and carries the lookup on the roster", () => {
    const roster = resolveBotRoster(bot, [], pointed, undefined, lookup);
    const [wheel] = roster.enabled;
    expect(wheel?.playbook.id).toBe("CRWV-WHEEL");
    expect(wheel?.playbook).not.toBe(CRWV_WHEEL);
    expect(wheel?.exitsOnly).toBeUndefined();
    expect(roster.convictionOf).toBe(lookup);
  });

  it("opens nothing on the pair while the view has not reached this bot", () => {
    const roster = resolveBotRoster(bot, [], pointed);
    expect(roster.enabled).toEqual([{ playbook: CRWV_WHEEL, mode: "standard", exitsOnly: true }]);
  });

  it("stops new entries on the view's check day when the pair's book failed it", () => {
    const unnarrowed = aMemberConviction({ checkOn: "2026-11-18", narrowings: [] });
    const r = (realizedPl: number) =>
      tradingRoster(
        {
          bot,
          subscriptions: pointed,
          enabled: [{ playbook: CRWV_WHEEL, mode: "standard" }],
          convictionOf: (id) => (id === unnarrowed.id ? unnarrowed : undefined),
        },
        { maxPositionPct: 0.03 },
        undefined,
        { ledgerOf: () => ({ realizedPl, putsClosed: 0, putsAssigned: 0 }) },
      );
    const sold = (t: ReturnType<typeof r>) =>
      t.persona.decide(market(), flat()).filter((i) => i.playbookId === "CRWV-WHEEL");
    expect(sold(r(230))).toHaveLength(1);
    expect(sold(r(-10))).toEqual([]);
  });

  /** #5482 contract piece 3: the inline conviction becomes a view stated on its one pair, so that
   *  view must run the pair unnarrowed and check it exactly as the inline copy did. */
  it("runs a view stated on its one pair like the inline conviction it replaces", () => {
    const onPair = aMemberConviction({ scope: "pair", checkOn: "2026-11-18", narrowings: [] });
    const lookupOne = (id: string) => (id === onPair.id ? onPair : undefined);
    expect(resolveBotRoster(bot, [], pointed, undefined, lookupOne).enabled).toEqual([
      { playbook: CRWV_WHEEL, mode: "standard" },
    ]);
    const r = (realizedPl: number) =>
      tradingRoster(
        {
          bot,
          subscriptions: pointed,
          enabled: [{ playbook: CRWV_WHEEL, mode: "standard" }],
          convictionOf: lookupOne,
        },
        { maxPositionPct: 0.03 },
        undefined,
        { ledgerOf: () => ({ realizedPl, putsClosed: 0, putsAssigned: 0 }) },
      );
    const sold = (t: { persona: Persona }) =>
      t.persona.decide(market(), flat()).filter((i) => i.playbookId === "CRWV-WHEEL");
    const inline = (realizedPl: number) =>
      roster(() => ({ realizedPl, putsClosed: 0, putsAssigned: 0 }));
    expect(sold(r(230))).toEqual(sold(inline(230)));
    expect(sold(r(230))).toHaveLength(1);
    expect(sold(r(-10))).toEqual(sold(inline(-10)));
    expect(sold(r(-10))).toEqual([]);
  });
});
