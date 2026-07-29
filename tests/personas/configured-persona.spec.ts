import type { MarketContext, OrderIntent, Portfolio } from "../../src/domain/types.js";
import { ConfiguredPersona } from "../../src/personas/configured-persona.js";
import { aContext, aPortfolio } from "../support/builders.js";

interface StubConfig {
  readonly threshold: number;
}

/** Minimal concrete persona used only to exercise the shared config scaffolding. */
class StubPersona extends ConfiguredPersona<StubConfig> {
  readonly id = "stub";
  readonly name = "Stub";
  readonly thesis = "Exercises ConfiguredPersona's shared config plumbing.";

  decide(_context: MarketContext, _portfolio: Portfolio): OrderIntent[] {
    return this.config.threshold > 0 ? [] : [];
  }

  /** Expose the stored config for assertions — production personas read it in `decide`. */
  readConfig(): StubConfig {
    return this.config;
  }
}

describe("ConfiguredPersona", () => {
  describe("a persona built with an explicit config", () => {
    it("stores exactly the config it was given, unmodified", () => {
      const persona = new StubPersona({ threshold: 42 });

      expect(persona.readConfig()).toEqual({ threshold: 42 });
    });
  });

  describe("the identity fields declared by the concrete persona", () => {
    it("are exposed on the Persona contract", () => {
      const persona = new StubPersona({ threshold: 1 });

      expect(persona.id).toBe("stub");
      expect(persona.name).toBe("Stub");
      expect(persona.thesis).toBeTruthy();
    });
  });

  describe("decide()", () => {
    it("remains the concrete persona's own pure function of (context, portfolio)", () => {
      const persona = new StubPersona({ threshold: 1 });

      expect(persona.decide(aContext({}), aPortfolio())).toEqual([]);
    });
  });
});
