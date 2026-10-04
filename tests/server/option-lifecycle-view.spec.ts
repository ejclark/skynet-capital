import { lifecycleRow, lifecycleRows } from "../../src/server/option-lifecycle-view.js";
import type { NormalizedLifecycleActivity } from "../../src/trading/option-lifecycle.js";

/**
 * The member-facing lifecycle rows (#3407 slice 4). What is pinned here is the HONESTY, not the
 * prose: which events the realized-P/L number includes, which it cannot, and that each one it
 * cannot says so in words. `option-lifecycle.ts` is the authority on those rules — these specs
 * exist so a row can never drift away from it silently, since the two files would then disagree
 * about the same event with only the row visible to a member.
 */

const contract = (
  over: Partial<NormalizedLifecycleActivity> = {},
): NormalizedLifecycleActivity => ({
  id: "a1",
  type: "OPEXP",
  symbol: "MSFT260918P00420000",
  quantity: 2,
  at: "2026-09-18T23:59:59.999Z",
  ...over,
});

describe("lifecycleRow — the contract, in a member's words", () => {
  it("decodes the OCC symbol and counts contracts", () => {
    const row = lifecycleRow(contract());
    expect(row.display).toBe("MSFT $420 PUT · 18 SEP 26");
    expect(row.underlying).toBe("MSFT");
    expect(row.unit).toBe("contracts");
    expect(row.quantity).toBe(2);
  });

  it("counts SHARES, with no underlying, on a settlement row that carries a bare ticker", () => {
    const row = lifecycleRow(
      contract({ type: "OPTRD", symbol: "MSFT", quantity: 200, price: 418.5 }),
    );
    expect(row.unit).toBe("shares");
    expect(row.underlying).toBeUndefined();
    expect(row.display).toBe("MSFT");
  });

  it("takes the unit from the EVENT TYPE, so a row can never contradict its own headline", () => {
    // Alpaca's OPTRD wire shape is unconfirmed (#837): it may yet arrive keyed on the OCC symbol.
    // Deriving the noun from the symbol would then print "Shares settled · 1 contract".
    expect(lifecycleRow(contract({ type: "OPTRD" })).unit).toBe("shares");
    // And the mirror: an expiry on a root this app can't parse is still about contracts.
    expect(lifecycleRow(contract({ type: "OPEXP", symbol: "WEIRDROOT" })).unit).toBe("contracts");
  });

  it("gives every type its own headline, so no two events read as the same thing", () => {
    const headlines = (["OPEXP", "OPASN", "OPEXC", "OPTRD"] as const).map(
      (type) => lifecycleRow(contract({ type })).headline,
    );
    expect(new Set(headlines).size).toBe(4);
  });
});

describe("lifecycleRow — what the realized P/L does and does not include", () => {
  it("counts an expiry: a worthless contract is an unambiguous $0 close", () => {
    const row = lifecycleRow(contract({ type: "OPEXP" }));
    expect(row.priced).toBe(true);
    expect(row.ledger).toMatch(/^Counted in your realized P\/L/);
  });

  it("counts an assignment for the CONTRACT, and says the shares are a separate position", () => {
    const row = lifecycleRow(contract({ type: "OPASN" }));
    expect(row.priced).toBe(true);
    // The writer's premium is scored; the stock leg has its own basis and arrives as its own row.
    expect(row.ledger).toMatch(/for the contract only/);
    expect(row.ledger).toMatch(/separate position/);
  });

  it("never prices an exercise, because a $0 close would read as a total loss on a winning trade", () => {
    const row = lifecycleRow(contract({ type: "OPEXC" }));
    expect(row.priced).toBe(false);
    expect(row.ledger).toMatch(/^Not counted in your realized P\/L/);
    expect(row.ledger).toMatch(/total loss/);
  });

  it("never prices a share settlement, and names the unconfirmed wire field as the reason", () => {
    const row = lifecycleRow(contract({ type: "OPTRD", symbol: "MSFT" }));
    expect(row.priced).toBe(false);
    expect(row.ledger).toMatch(/^Not counted in your realized P\/L/);
    expect(row.ledger).toMatch(/side/);
  });

  it("carries the verdict and its reason in ONE sentence, so no rendering can show one alone", () => {
    for (const type of ["OPEXP", "OPASN", "OPEXC", "OPTRD"] as const) {
      const row = lifecycleRow(contract({ type }));
      // A bare "Counted"/"Not counted" label would be a verdict with no reason beside it.
      expect(row.ledger).toMatch(/P\/L[^.]*[—:]/);
      expect(row.ledger.length).toBeGreaterThan(60);
    }
  });
});

describe("lifecycleRow — a price only where one is documented", () => {
  it("reports an OPTRD's per-share price", () => {
    expect(lifecycleRow(contract({ type: "OPTRD", symbol: "MSFT", price: 418.5 })).price).toBe(
      418.5,
    );
  });

  it("drops a price the broker echoed on a type not documented to carry one", () => {
    // Alpaca does not document `price` on OPEXP/OPASN/OPEXC. Rendering one would put a number on
    // screen that nothing in this app can stand behind.
    for (const type of ["OPEXP", "OPASN", "OPEXC"] as const) {
      expect(lifecycleRow(contract({ type, price: 7.5 })).price).toBeUndefined();
    }
  });
});

describe("lifecycleRows — newest first, capped", () => {
  const at = (iso: string, id: string) => contract({ id, at: iso });

  it("re-sorts rather than trusting the broker's order", () => {
    const rows = lifecycleRows(
      [at("2026-08-21T23:59:59.999Z", "old"), at("2026-09-18T23:59:59.999Z", "new")],
      10,
    );
    expect(rows.map((r) => r.id)).toEqual(["new", "old"]);
  });

  it("caps at the limit, keeping the newest", () => {
    const rows = lifecycleRows(
      [
        at("2026-07-17T23:59:59.999Z", "c"),
        at("2026-09-18T23:59:59.999Z", "a"),
        at("2026-08-21T23:59:59.999Z", "b"),
      ],
      2,
    );
    expect(rows.map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("answers nothing for a zero or negative limit instead of throwing", () => {
    expect(lifecycleRows([at("2026-09-18T23:59:59.999Z", "a")], 0)).toEqual([]);
    expect(lifecycleRows([at("2026-09-18T23:59:59.999Z", "a")], -5)).toEqual([]);
  });
});
