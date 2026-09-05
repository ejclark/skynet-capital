import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { MarketEvent } from "../../src/domain/market-events.js";
import {
  eventCalls,
  findResearchDoc,
  listResearch,
  researchedEventIds,
  shelfSymbols,
  symbolResearch,
  todayCallOf,
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

describe("todayCallOf — the call, read verbatim", () => {
  const header = (table: string): string =>
    `# T\n\n## At a glance\n\n**TL;DR.** Something.\n\n${table}\n\n## Initial research\n\nBody.\n`;

  it("reads the Today row's call out of the three-column shape", () => {
    const md = header(
      "| Horizon | Call | Why |\n|---|---|---|\n| Today | Stand aside | no catalyst |",
    );
    expect(todayCallOf(md)).toEqual({ call: "Stand aside", horizon: "Today" });
  });

  it("reads confidence when the five-column shape carries it", () => {
    const md = header(
      "| Horizon | Call | Confidence | Why | Proves it wrong |\n|---|---|---|---|---|\n| Today | Stand aside | High | no catalyst | a close over 135 |",
    );
    expect(todayCallOf(md)).toEqual({ call: "Stand aside", horizon: "Today", confidence: "High" });
  });

  it("locates columns by NAME, so column order never changes the answer", () => {
    const md = header(
      "| Horizon | Why | Call |\n|---|---|---|\n| Today | no catalyst | Stand aside |",
    );
    expect(todayCallOf(md)?.call).toBe("Stand aside");
  });

  it("matches a Today label carrying a parenthetical", () => {
    const md = header(
      "| Horizon | Call | Why |\n|---|---|---|\n| Today (D-13) | Flat by D-1 | gap risk |",
    );
    expect(todayCallOf(md)).toEqual({ call: "Flat by D-1", horizon: "Today (D-13)" });
  });

  it("falls back to the nearest horizon row when no Today row exists", () => {
    const md = header("| Horizon | Call | Why |\n|---|---|---|\n| This week | Watch | pending |");
    expect(todayCallOf(md)).toEqual({ call: "Watch", horizon: "This week" });
  });

  it("strips authoring emphasis so the chip carries text, not markup", () => {
    const md = header("| Horizon | Call | Why |\n|---|---|---|\n| Today | **Stand aside** | x |");
    expect(todayCallOf(md)?.call).toBe("Stand aside");
  });

  it("also reads a study's `## The call` header, trailing clause and all", () => {
    const md =
      "# S\n\n## The call — what to do, by name\n\n| Name | The call | Confidence | Why | Proves me wrong |\n|---|---|---|---|---|\n| MU | Don't initiate here | High | priced in | DRAM over +18% QoQ |\n\n## The headline\n\nBody.\n";
    expect(todayCallOf(md)?.call).toBe("Don't initiate here");
  });

  it("returns null rather than guessing when the header states no call", () => {
    expect(todayCallOf("# T\n\n## Initial research\n\nNo header at all.\n")).toBeNull();
    expect(todayCallOf(header("Just prose, no table."))).toBeNull();
    expect(
      todayCallOf(header("| Horizon | Why |\n|---|---|\n| Today | no call column |")),
    ).toBeNull();
    expect(
      todayCallOf(header("| Horizon | Call | Why |\n|---|---|---|\n| Today |  | empty |")),
    ).toBeNull();
  });
});

describe("eventCalls", () => {
  it("maps event ids to the calls their ledgers reached", () => {
    const calls = eventCalls(fixtureRoot());
    expect(calls.get("nvda-2026-08-26-print")).toEqual({ call: "Stand aside", horizon: "Today" });
  });
});

describe("findResearchDoc — reader-side folds", () => {
  it("folds the method wall and the append-only ledger, leaving the stance open", () => {
    const rendered = findResearchDoc("events/nvda-2026-08-26-print", fixtureRoot());
    expect(rendered?.html).toContain("Initial research");
    expect(rendered?.html).toContain('<details class="rs-fold"');
    // The stance renders as a plain heading — never folded away.
    expect(rendered?.html).toContain("<h2>Stance &amp; kill switches</h2>");
  });

  it("labels each fold with its size, so nothing is hidden silently", () => {
    const rendered = findResearchDoc("events/nvda-2026-08-26-print", fixtureRoot());
    expect(rendered?.html).toContain("rs-foldsize");
  });

  it("keeps every word — a fold relocates, it never rewrites", () => {
    const rendered = findResearchDoc("events/nvda-2026-08-26-print", fixtureRoot());
    expect(rendered?.html).toContain("Body.");
    expect(rendered?.html).toContain("Defined-risk only");
  });
});

describe("findResearchDoc — the forward-test register is composed from per-event fragments (#1449)", () => {
  function registerRoot(): string {
    const root = fixtureRoot();
    writeFileSync(
      join(root, "forward-tests.md"),
      "# Forward-test register\n\n<!-- no rows here -->\n\nIntro paragraph.\n",
    );
    mkdirSync(join(root, "forward-tests"));
    writeFileSync(
      join(root, "forward-tests", "legacy.md"),
      "# Forward tests — legacy\n\n<!-- frozen -->\n\n| # | Hypothesis |\n|---|---|\n| FT-1 | legacy row |\n",
    );
    writeFileSync(
      join(root, "forward-tests", "nvda-2026-08-26-print.md"),
      "# Forward tests — nvda-2026-08-26-print\n\n<!-- owned by one lane -->\n\n| # | Hypothesis |\n|---|---|\n| FT-nvda-2026-08-26-print-1 | see [ledger](../events/nvda-2026-08-26-print.md) |\n",
    );
    return root;
  }

  it("serves index + every fragment as one document, legacy last, authoring comments dropped", () => {
    const rendered = findResearchDoc("forward-tests", registerRoot());
    expect(rendered?.html).toContain("Intro paragraph.");
    expect(rendered?.html).toContain("FT-nvda-2026-08-26-print-1");
    expect(rendered?.html).toContain("FT-1");
    expect(rendered?.html).not.toContain("owned by one lane");
    expect(rendered?.html.indexOf("FT-nvda-2026-08-26-print-1")).toBeLessThan(
      rendered?.html.indexOf(">FT-1<") ?? -1,
    );
  });

  it("re-anchors a fragment's relative links to live routes, and lists no fragment as its own study", () => {
    const root = registerRoot();
    expect(findResearchDoc("forward-tests", root)?.html).toContain(
      'href="/research/events/nvda-2026-08-26-print"',
    );
    expect(listResearch(root).studies.map((d) => d.slug)).not.toContain("forward-tests/legacy");
  });
});
