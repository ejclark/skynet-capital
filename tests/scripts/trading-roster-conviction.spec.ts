import type { Bot } from "../../src/bots/bot.js";
import type { Portfolio } from "../../src/domain/types.js";
import type { Persona } from "../../src/personas/persona.js";
import { CRWV_WHEEL } from "../../src/playbooks/registry.js";
import type { ConvictionGateDeps } from "../../src/playbooks/with-conviction-gate.js";
import { tradingRoster } from "../../src/scripts/autonomous-live-wiring.js";
import { buildOccSymbol } from "../../src/trading/option-symbols.js";
import {
  aContext,
  anOptionQuote,
  aPortfolio,
  aSubscription,
  withOptionQuotes,
} from "../support/builders.js";

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
