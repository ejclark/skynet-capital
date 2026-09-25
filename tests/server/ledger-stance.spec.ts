import { readLedger } from "../../src/server/ledger-stance.js";

/** Reading a research ledger for the Brief (#3729) — conservative: only an explicit bold "Buy" licenses one. */

const ledger = (signals: string) => `# X print
**Kind:** earnings · **Date:** 2026-11-10
**Last assessed:** 2026-09-18
<!-- probe-ref: {"symbols":{"CRWV":79.88},"vix":15.4} -->

## At a glance

**TL;DR.** *(D-47 pulse, 2026-09-24.)* Stance unchanged.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-47) | **Stand aside** · E1 | High | reasons | a falsifier |

**Signals & conditions** — the buy/sell/hold triggers:

${signals}
`;

describe("readLedger", () => {
  it("takes the newest of Last assessed and a dated pulse, the probe price, and the Today call", () => {
    expect(readLedger(ledger("- **No buy signal exists** — S1 kill-listed."), "CRWV")).toEqual({
      assessed: "2026-09-24",
      probePrice: 79.88,
      stance: "Stand aside · E1",
      confidence: "high",
      buySignal: false,
    });
  });

  it("licenses a buy only on a bullet that leads with bold Buy", () => {
    expect(readLedger(ledger("- **Buy** — S1 window open D-20→D-5."), "CRWV").buySignal).toBe(true);
    expect(readLedger(ledger("- **Buy/sell** — neither licensed."), "CRWV").buySignal).toBe(false);
    expect(readLedger(ledger("- prose that says buy somewhere"), "CRWV").buySignal).toBe(false);
  });
});
