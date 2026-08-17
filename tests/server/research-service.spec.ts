import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { MarketEvent } from "../../src/domain/market-events.js";
import {
  findResearchDoc,
  listResearch,
  researchedEventIds,
  shelfSymbols,
  symbolResearch,
} from "../../src/server/research-service.js";

const AS_OF = "2026-08-16T12:00:00Z";

const event = (overrides: Partial<MarketEvent> & { id: string; date: string }): MarketEvent => ({
  kind: "earnings",
  title: `Event ${overrides.id}`,
  status: "confirmed",
  source: "IR: company newsroom",
  impact: "critical",
  symbols: [],
  ...overrides,
});

/** A disposable docs/research tree — the service's injectable root. */
function fixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "research-"));
  mkdirSync(join(root, "events"));
  writeFileSync(
    join(root, "alpha-study.md"),
    "# Alpha study — the QQQ question\n\nMentions NVDA by name, with a table:\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\nSee [`beta-study.md`](beta-study.md) and [the ledger](events/nvda-2026-08-26-print.md).\n",
  );
  writeFileSync(join(root, "beta-study.md"), "# Beta study\n\nNo tickers named here.\n");
  writeFileSync(join(root, "TEMPLATE.md"), "# Never listed\n");
  writeFileSync(
    join(root, "events", "nvda-2026-08-26-print.md"),
    "# NVDA earnings print — ledger\n\n**Last assessed:** 2026-08-15\n\n## At a glance\n\n**TL;DR.** Guards only; implied ~7% vs ~2.8% realized.\n\n| Horizon | Call | Why |\n|---|---|---|\n| Today | Stand aside | no catalyst |\n\n## Initial research\n\nBody.\n\n## Stance & kill switches\n\nDefined-risk only; see [`alpha-study.md`](../alpha-study.md).\n\n## Assessment ledger\n\n| Date |\n|---|\n",
  );
  writeFileSync(
    join(root, "events", "TEMPLATE.md"),
    "# Template\n\n**Last assessed:** <YYYY-MM-DD>\n",
  );
  return root;
}

describe("listResearch", () => {
  it("shelves studies and event ledgers separately, skipping templates", () => {
    const shelf = listResearch(fixtureRoot());
    expect(shelf.studies.map((d) => d.slug)).toEqual(["alpha-study", "beta-study"]);
    expect(shelf.ledgers.map((d) => d.slug)).toEqual(["events/nvda-2026-08-26-print"]);
    expect(shelf.studies[0]?.title).toBe("Alpha study — the QQQ question");
    expect(shelf.ledgers[0]?.lastAssessed).toBe("2026-08-15");
  });
});

describe("findResearchDoc", () => {
  it("renders a known slug to HTML, GFM tables included", () => {
    const doc = findResearchDoc("alpha-study", fixtureRoot());
    expect(doc?.html).toContain("<table>");
    expect(doc?.title).toBe("Alpha study — the QQQ question");
  });

  it("rewrites doc-internal .md links to live /research routes", () => {
    const root = fixtureRoot();
    expect(findResearchDoc("alpha-study", root)?.html).toContain(
      'href="/research/events/nvda-2026-08-26-print"',
    );
    // ...in both directions: a ledger's ../ links climb back to the shelf.
    expect(findResearchDoc("events/nvda-2026-08-26-print", root)?.html).toContain(
      'href="/research/alpha-study"',
    );
  });

  it("resolves slugs by shelf membership — unknown and hostile paths both miss", () => {
    const root = fixtureRoot();
    expect(findResearchDoc("no-such-doc", root)).toBeNull();
    expect(findResearchDoc("../package.json", root)).toBeNull();
    expect(findResearchDoc("events/../../etc/passwd", root)).toBeNull();
    expect(findResearchDoc("TEMPLATE", root)).toBeNull();
  });
});

describe("researchedEventIds", () => {
  it("exposes exactly the ledgered event ids — the calendar's link set", () => {
    expect([...researchedEventIds(fixtureRoot())]).toEqual(["nvda-2026-08-26-print"]);
  });
});

describe("findResearchDoc — At a glance header", () => {
  it("extracts the decision header and strips it from the body (no duplication)", () => {
    const doc = findResearchDoc("events/nvda-2026-08-26-print", fixtureRoot());
    // The header renders separately, table included…
    expect(doc?.glanceHtml).toContain("Guards only");
    expect(doc?.glanceHtml).toContain("<table>");
    // `~` is "approximately", never strikethrough — GFM single-tilde pairing stays disabled.
    expect(doc?.glanceHtml).not.toContain("<del>");
    expect(doc?.glanceHtml).toContain("~7%");
    // …and is removed from the body, which still carries everything else.
    expect(doc?.html).not.toContain("Guards only");
    expect(doc?.html).toContain("Body.");
    expect(doc?.html).toContain('href="/research/alpha-study"');
  });

  it("returns a null header for a doc with no At a glance section", () => {
    expect(findResearchDoc("alpha-study", fixtureRoot())?.glanceHtml).toBeNull();
  });
});

describe("symbolResearch", () => {
  const upcoming = [
    event({ id: "nvda-2026-08-26-print", date: "2026-08-26", symbols: ["NVDA"] }),
    event({
      id: "nvda-2026-11-25-print",
      date: "2026-11-25",
      symbols: ["NVDA"],
      status: "estimate",
    }),
    event({ id: "cpi-2026-09-11", date: "2026-09-11", kind: "macro-print", impact: "high" }),
  ];

  it("assembles the symbol's events, ledgers, and mentioning studies", () => {
    const data = symbolResearch("nvda", AS_OF, fixtureRoot(), upcoming);
    expect(data?.symbol).toBe("NVDA");
    expect(data?.events.map((e) => e.id)).toEqual([
      "nvda-2026-08-26-print",
      "nvda-2026-11-25-print",
    ]);
    expect(data?.ledgers.map((d) => d.slug)).toEqual(["events/nvda-2026-08-26-print"]);
    expect(data?.studies.map((d) => d.slug)).toEqual(["alpha-study"]);
  });

  it("excerpts the stance verbatim from the nearest upcoming ledger", () => {
    const data = symbolResearch("NVDA", AS_OF, fixtureRoot(), upcoming);
    expect(data?.stance?.from.slug).toBe("events/nvda-2026-08-26-print");
    expect(data?.stance?.html).toContain("Defined-risk only");
    expect(data?.stance?.html).toContain('href="/research/alpha-study"');
  });

  it("returns null for symbols with no research surface and for malformed input", () => {
    const root = fixtureRoot();
    expect(symbolResearch("ZZZT", AS_OF, root, upcoming)).toBeNull();
    expect(symbolResearch("../nv", AS_OF, root, upcoming)).toBeNull();
    expect(symbolResearch("", AS_OF, root, upcoming)).toBeNull();
  });
});

describe("shelfSymbols", () => {
  it("cards only ledgered symbols, each with its next upcoming event", () => {
    const upcoming = [
      event({ id: "nvda-2026-08-26-print", date: "2026-08-26", symbols: ["NVDA"] }),
      event({ id: "zzzt-2026-09-01-print", date: "2026-09-01", symbols: ["ZZZT"] }),
    ];
    const cards = shelfSymbols(AS_OF, fixtureRoot(), upcoming);
    const nvda = cards.find((c) => c.symbol === "NVDA");
    expect(nvda?.next?.id).toBe("nvda-2026-08-26-print");
    // ZZZT is on the calendar but has no ledger — no card until research exists.
    expect(cards.some((c) => c.symbol === "ZZZT")).toBe(false);
  });
});
