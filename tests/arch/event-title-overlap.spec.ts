import { titleOverlapWarnings } from "../../scripts/event-title-overlap.mjs";

/**
 * The advisory same-date duplicate detector (#3101), and the one narrowing #5912 added: events that
 * each name tickers and share none are two companies' events, so a shared title template never
 * makes them a duplicate. Market-wide events keep being scored.
 */
const ev = (id: string, title: string, symbols: string[] = []) => ({
  id,
  title,
  date: "2026-11-30",
  symbols,
});

describe("titleOverlapWarnings", () => {
  it("flags a market-wide pair whose titles say the same thing", () => {
    const warnings = titleOverlapWarnings([
      ev("presidents-day-2027", "Presidents Day — NYSE closed (Washington's Birthday)"),
      ev("washingtons-birthday-2027", "Washington's Birthday — NYSE closed"),
    ]);
    expect(warnings).toHaveLength(1);
  });

  it("never flags two companies' events cut from one title template", () => {
    const warnings = titleOverlapWarnings([
      ev(
        "inio-lockup-expiry-2026-11-30",
        "INIO IPO lockup ends — Innio N.V., 180 days after its 2026-06-03 prospectus",
        ["INIO"],
      ),
      ev(
        "qnt-lockup-expiry-2026-11-30",
        "QNT IPO lockup ends — Quantinuum, 180 days after its 2026-06-03 prospectus",
        ["QNT"],
      ),
    ]);
    expect(warnings).toEqual([]);
  });

  it("still flags a same-ticker pair", () => {
    const warnings = titleOverlapWarnings([
      ev("qnt-lockup-expiry-2026-11-30", "QNT IPO lockup ends — Quantinuum, 180 days", ["QNT"]),
      ev("quantinuum-lockup-2026-11-30", "Quantinuum IPO lockup ends, 180 days", ["QNT"]),
    ]);
    expect(warnings).toHaveLength(1);
  });
});
