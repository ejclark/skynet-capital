import { dayLensFog } from "../../src/live/fog";
import type { PlaysIndex } from "../../src/live/options";

// The day lens is fogged behind rung 501 (docs/FOG-OF-WAR.md) — honestly, since the rung is not built.
const base: PlaysIndex = { linked: true, wheels: true, plays: [] };

describe("dayLensFog", () => {
  it("fogs a wheels-on member and says the rung is not built yet", () => {
    const fog = dayLensFog(base);
    expect(fog.fogged).toBe(true);
    expect(fog.reason).toContain("501");
    expect(fog.reason).toContain("not built yet");
  });

  it("lets a wheels-off member see through", () => {
    expect(dayLensFog({ ...base, wheels: false })).toEqual({ fogged: false, reason: "" });
  });

  it("reads unknown as open — a fetch failure never fogs the wrong people", () => {
    expect(dayLensFog(undefined).fogged).toBe(false);
  });

  it("opens once the rung exists and is earned; names the earn while it is unearned", () => {
    const rung = {
      code: "501" as never,
      id: "zero-dte",
      name: "Zero-DTE",
      tldr: "",
      kind: "option" as const,
      side: "buy" as const,
      gloss: "",
      locked: true,
      earned: false,
    };
    expect(dayLensFog({ ...base, plays: [rung] }).reason).toContain("is earned");
    expect(dayLensFog({ ...base, plays: [{ ...rung, earned: true }] }).fogged).toBe(false);
  });
});
