import { readFileSync } from "node:fs";
import { readLedger } from "../../src/server/ledger-stance.js";

/** Reading a research ledger for the guidance (#3729) — conservative: only an explicit bold "Buy" licenses one. */

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
      stance: "Stand aside",
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

describe("readLedger — a ledger appends a probe per pulse", () => {
  it("grades against the NEWEST probe, not the first one in the file", () => {
    const md = `${ledger("- **No buy signal exists**")}

**Last assessed:** 2026-09-21
<!-- probe-ref: {"symbols":{"CRWV":81.36}} -->

**Last assessed:** 2026-09-24
<!-- probe-ref: {"symbols":{"CRWV":86.90}} -->
`;
    expect(readLedger(md, "CRWV")).toMatchObject({ assessed: "2026-09-24", probePrice: 86.9 });
  });

  it("reads the real CRWV ledger's newest probe", () => {
    const md = readFileSync("docs/research/events/crwv-2026-11-10-print.md", "utf8");
    const probes = [...md.matchAll(/probe-ref: \{"symbols":\{"CRWV":([\d.]+)\}/g)].map((m) =>
      Number(m[1]),
    );
    expect(readLedger(md, "CRWV").probePrice).toBe(probes.at(-1));
  });

  // #3729 persona review: "S2 · E1" and "09-30" mean nothing on a trade form.
  it("drops the research's playbook codes and writes dates the way the tab does", () => {
    const md = ledger("").replace(
      "| **Stand aside** · E1 |",
      "| Stand aside · S2 · E1 — nothing before **MU 09-30** / **Fully Connected 09-29–10-01** |",
    );
    expect(readLedger(md, "CRWV").stance).toBe(
      "Stand aside — nothing before MU Sep 30 / Fully Connected Sep 29–Oct 1",
    );
  });
});
