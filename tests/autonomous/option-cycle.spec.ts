import { describe, expect, it } from "@rstest/core";
import {
  actionFor,
  DEFAULT_OPTION_COOLDOWN_MS,
  readCycleOptions,
} from "../../src/autonomous/option-cycle.js";
import type {
  ListedExpirations,
  OptionDemand,
  OptionMarket,
  OptionMarketRequest,
  OrderResult,
  OrderStatus,
} from "../../src/domain/types.js";
import type { Persona } from "../../src/personas/persona.js";
import type { OptionMarketPort } from "../../src/ports/option-market.js";
import { aContext, anOptionIntent, aPortfolio } from "../support/builders.js";

/** A port that remembers what it was asked and answers with `answer`. */
function recordingPort(answer: OptionMarket | undefined): {
  readonly port: OptionMarketPort;
  readonly requests: OptionMarketRequest[];
} {
  const requests: OptionMarketRequest[] = [];
  return {
    requests,
    port: {
      readOptionMarket(request) {
        requests.push(request);
        return Promise.resolve(answer);
      },
    },
  };
}

function aPersona(overrides: Partial<Persona> = {}): Persona {
  return {
    id: "wheel-bot",
    name: "Wheel Bot",
    thesis: "sells puts below support",
    decide: () => [],
    ...overrides,
  };
}

const NEEDS_ONE_CONTRACT: OptionDemand = { chains: [], contracts: ["CRWV261106P00085000"] };
const MARKET: OptionMarket = { listed: { CRWV: ["2026-11-06"] }, contracts: {} };
const CONTEXT = aContext({ CRWV: { last: 90 } }, "2026-10-05T14:30:00Z");

describe("DEFAULT_OPTION_COOLDOWN_MS", () => {
  it("is ten minutes between option attempts on one underlying", () => {
    expect(DEFAULT_OPTION_COOLDOWN_MS).toBe(600_000);
  });
});

describe("readCycleOptions", () => {
  describe("when the persona has option plays and a port is wired", () => {
    it("returns the market the port read", async () => {
      const { port } = recordingPort(MARKET);
      const persona = aPersona({
        optionUnderlyings: ["CRWV"],
        optionDemand: () => NEEDS_ONE_CONTRACT,
      });

      const market = await readCycleOptions(persona, port, {
        context: CONTEXT,
        portfolio: aPortfolio(),
        skip: new Set(),
      });

      expect(market).toEqual(MARKET);
    });

    it("asks for the persona's underlyings at the cycle's snapshot time, skipping the cooling ones", async () => {
      const { port, requests } = recordingPort(MARKET);
      const persona = aPersona({
        optionUnderlyings: ["CRWV", "NVDA"],
        optionDemand: () => NEEDS_ONE_CONTRACT,
      });
      const skip = new Set(["NVDA"]);

      await readCycleOptions(persona, port, { context: CONTEXT, portfolio: aPortfolio(), skip });

      expect(requests).toHaveLength(1);
      expect(requests[0]?.asOf).toBe("2026-10-05T14:30:00Z");
      expect(requests[0]?.underlyings).toEqual(["CRWV", "NVDA"]);
      expect(requests[0]?.skip).toEqual(new Set(["NVDA"]));
    });

    it("hands the port a demand that answers from the persona, the cycle's time, the portfolio and what is listed", async () => {
      const { port, requests } = recordingPort(MARKET);
      const seen: { asOf: string; cash: number; listed: ListedExpirations }[] = [];
      const persona = aPersona({
        optionUnderlyings: ["CRWV"],
        optionDemand(asOf, portfolio, listed) {
          seen.push({ asOf, cash: portfolio.cash, listed });
          return NEEDS_ONE_CONTRACT;
        },
      });

      await readCycleOptions(persona, port, {
        context: CONTEXT,
        portfolio: aPortfolio({ cash: 1234 }),
        skip: new Set(),
      });
      const listed: ListedExpirations = { CRWV: ["2026-11-06", "2026-11-13"] };
      const demand = requests[0]?.demand(listed);

      expect(demand).toEqual(NEEDS_ONE_CONTRACT);
      expect(seen).toEqual([{ asOf: "2026-10-05T14:30:00Z", cash: 1234, listed }]);
    });

    it("keeps the persona's own state available to its demand function", async () => {
      const { port, requests } = recordingPort(MARKET);
      const persona = {
        ...aPersona({ optionUnderlyings: ["CRWV"] }),
        watched: "CRWV261106P00085000",
        optionDemand(this: { watched: string }): OptionDemand {
          return { chains: [], contracts: [this.watched] };
        },
      } satisfies Persona & { watched: string };

      await readCycleOptions(persona, port, {
        context: CONTEXT,
        portfolio: aPortfolio(),
        skip: new Set(),
      });

      expect(requests[0]?.demand({})).toEqual({ chains: [], contracts: ["CRWV261106P00085000"] });
    });

    it("passes through a port that has nothing to report", async () => {
      const { port } = recordingPort(undefined);
      const persona = aPersona({
        optionUnderlyings: ["CRWV"],
        optionDemand: () => NEEDS_ONE_CONTRACT,
      });

      const market = await readCycleOptions(persona, port, {
        context: CONTEXT,
        portfolio: aPortfolio(),
        skip: new Set(),
      });

      expect(market).toBeUndefined();
    });

    it("asks about no underlyings when the persona names none", async () => {
      const { port, requests } = recordingPort(MARKET);
      const persona = aPersona({ optionDemand: () => NEEDS_ONE_CONTRACT });

      await readCycleOptions(persona, port, {
        context: CONTEXT,
        portfolio: aPortfolio(),
        skip: new Set(),
      });

      expect(requests[0]?.underlyings).toEqual([]);
    });
  });

  describe("when the persona has no option plays", () => {
    it("reads nothing and returns no market", async () => {
      const { port, requests } = recordingPort(MARKET);

      const market = await readCycleOptions(aPersona({ optionUnderlyings: ["CRWV"] }), port, {
        context: CONTEXT,
        portfolio: aPortfolio(),
        skip: new Set(),
      });

      expect(market).toBeUndefined();
      expect(requests).toHaveLength(0);
    });
  });

  describe("when no option port is wired", () => {
    it("returns no market even though the persona has option plays", async () => {
      const persona = aPersona({
        optionUnderlyings: ["CRWV"],
        optionDemand: () => NEEDS_ONE_CONTRACT,
      });

      const market = await readCycleOptions(persona, undefined, {
        context: CONTEXT,
        portfolio: aPortfolio(),
        skip: new Set(),
      });

      expect(market).toBeUndefined();
    });
  });

  describe("when the port throws", () => {
    it("reads as no quotes instead of failing the cycle", async () => {
      const port: OptionMarketPort = {
        readOptionMarket() {
          return Promise.reject(new Error("feed down"));
        },
      };
      const persona = aPersona({
        optionUnderlyings: ["CRWV"],
        optionDemand: () => NEEDS_ONE_CONTRACT,
      });

      await expect(
        readCycleOptions(persona, port, {
          context: CONTEXT,
          portfolio: aPortfolio(),
          skip: new Set(),
        }),
      ).resolves.toBeUndefined();
    });
  });
});

describe("actionFor", () => {
  const resultWith = (status: OrderStatus): OrderResult => ({
    intent: anOptionIntent(),
    status,
  });

  describe("when the order ended with nothing traded", () => {
    it("reads a rejected order as rejected", () => {
      expect(actionFor(resultWith("rejected"))).toBe("rejected");
    });

    it("reads an unfilled order as rejected", () => {
      expect(actionFor(resultWith("unfilled"))).toBe("rejected");
    });
  });

  describe("when the order went through or may still fill", () => {
    it("reads a filled order as placed", () => {
      expect(actionFor(resultWith("filled"))).toBe("placed");
    });

    it("reads a working order as placed, since it may still fill", () => {
      expect(actionFor(resultWith("working"))).toBe("placed");
    });
  });
});
