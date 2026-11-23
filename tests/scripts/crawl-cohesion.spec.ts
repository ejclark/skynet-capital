import { describe, expect, it } from "@rstest/core";
import {
  againstBudget,
  apiPaths,
  checkHomes,
  conceptHomes,
  importsOf,
  isName,
  keyDrops,
  labelCollisions,
  ledgerRows,
  lowered,
  type Name,
  normalizeName,
  parseConcepts,
  parseLabelRecord,
  parsePlaces,
  placeParts,
  scanLinks,
} from "../../scripts/crawl/cohesion-plan.mjs";

// The cohesion census's pure half (#8005 slice 1), driven over fixture strings: each rule the
// report's five numbers rest on, and the ratchet that keeps them advisory.

describe("names", () => {
  it("folds two spellings of one word together, and drops what is not a word", () => {
    expect(normalizeName("Playbooks")).toBe(normalizeName("playbook"));
    expect(normalizeName("Full leaderboard ›")).toBe("leaderboard");
    expect(normalizeName("the onboarding page")).toBe("onboarding");
    expect(normalizeName("R&amp;D")).toBe("r&d");
    expect(normalizeName("Guidance for this stock")).toBe("guidance for this stock");
    expect(normalizeName("◆ ›")).toBe("");
  });

  it("takes a noun phrase as a name and an action as not one", () => {
    expect(isName("Trade")).toBe(true);
    expect(isName("Full leaderboard ›")).toBe(true);
    expect(isName("Sell these shares →")).toBe(false);
    expect(isName("Connect one in Onboarding")).toBe(false);
    expect(isName("a very long phrase of words")).toBe(false);
  });

  it("reads a record's labels from its value, never from its type annotation", () => {
    const src =
      'export const WINDOW_LABEL: Readonly<Record<W, { glyph: string; label: string }>> = {\n  overview: { glyph: "▤", label: "Overview" },\n  party: { glyph: "◉", label: "Party" },\n};';
    expect(parseLabelRecord(src, "WINDOW_LABEL")).toEqual({ overview: "Overview", party: "Party" });
    const plain =
      'use(CHAPTER_NAMES[x]); const y = { a: "no" };\nconst CHAPTER_NAMES: R = { trading: "Trading progression" };';
    expect(parseLabelRecord(plain, "CHAPTER_NAMES")).toEqual({ trading: "Trading progression" });
    expect(parsePlaces('{ path: "/trade", name: "Trade", what: "x" },')).toEqual([
      { path: "/trade", name: "Trade" },
    ]);
  });
});

describe("scanLinks", () => {
  const src = [
    '<Link to="/leaderboard" search={{ by: metric }} className="x">',
    "  Full leaderboard ›",
    "</Link>",
    '<Link to="/trade" search={tradeSearch(deskId, p)}>Trade</Link>',
    '<Link to="/accounts" search={{ account: deskId }} hash={positionAnchor(symbol)}>Back</Link>',
    '<Link to="/research" search={(prev) => ({ ...prev, section: "board" })}>R&amp;D</Link>',
    '<a href="/app/accounts?section=milestones&chapter=onboarding">Onboarding</a>',
    "<Link to={dynamic}>x</Link>",
  ].join("\n");
  const links = scanLinks(src);

  it("reads literal targets, the search keys they name and their words", () => {
    expect(links.map((l) => l.to)).toEqual([
      "/leaderboard",
      "/trade",
      "/accounts",
      "/research",
      "/accounts",
    ]);
    expect(links[0]).toMatchObject({
      keys: ["by"],
      text: "Full leaderboard ›",
      line: 1,
      opaque: false,
    });
    expect(links[4]).toMatchObject({
      values: { section: "milestones", chapter: "onboarding" },
      text: "Onboarding",
    });
  });

  it("marks a helper-built search opaque, a spread one as keeping the page's own, and reads a helper-built anchor", () => {
    expect(links[1]?.opaque).toBe(true);
    expect(links[3]).toMatchObject({ keepsPrev: true, values: { section: "board" } });
    expect(links[2]?.hash).toBe("pos-");
  });
});

describe("labelCollisions", () => {
  const n = (
    word: string,
    place: string,
    home: string,
    level: "page" | "screen" = "screen",
  ): Name => ({
    word,
    raw: word,
    place,
    level,
    home,
    source: "fixture",
  });

  it("counts a word naming places in two IA groups, never one naming twins in one group", () => {
    const r = labelCollisions([
      n("playbook", "/accounts ?section=playbooks", "loop"),
      n("playbook", "/research ?section=playbooks", "rd"),
      n("ledger", "/accounts ?section=ledger", "book"),
      n("ledger", "/u/$id/ledger", "book"),
    ]);
    expect(r.oneWordManyPlaces.map((c) => c.word)).toEqual(["playbook"]);
  });

  it("counts a place under two words at one level, never a tab against its default section", () => {
    const r = labelCollisions([
      n("campaign", "/", "landing", "page"),
      n("landing", "/", "landing", "page"),
      n("profile", "/accounts", "book", "page"),
      n("overview", "/accounts ?section=overview", "book"),
    ]);
    expect(r.onePlaceManyWords.map((c) => c.place)).toEqual(["/"]);
  });
});

describe("concepts", () => {
  const ia = [
    "### 2f. The member's concepts",
    "",
    "| Concept | A member reads | Entities | Held on |",
    "|---|---|---|---|",
    "| `history` | Ledger · Activity | Activity event | `/accounts ?section=ledger` · `/activity` |",
    "| `pulse` | Pulse | Pulse | `/u/$id/pulse` |",
    "",
    "## 3. The keys table",
  ].join("\n");

  it("reads §2f and gives each concept the homes of the screens that hold it", () => {
    const homeOf = new Map<string, string | undefined>([
      ["/accounts ?section=ledger", "book"],
      ["/activity", "league"],
      ["/u/$id/pulse", "book"],
    ]);
    const c = conceptHomes(parseConcepts(ia), homeOf);
    expect(c.map((x) => [x.id, x.homes])).toEqual([
      ["history", ["book", "league"]],
      ["pulse", ["book"]],
    ]);
  });

  it("throws on a screen triage.json does not have — a typo cannot vanish", () => {
    expect(() => conceptHomes(parseConcepts(ia), new Map())).toThrow(/does not have/);
  });

  it("throws when a §5 group the homes name has lost its heading", () => {
    expect(() => checkHomes("### 5.1 The book\n")).toThrow(/5\.2/);
  });
});

describe("keyDrops", () => {
  const file = (src: string) => ({ file: "app/src/shell/x.tsx", src, links: scanLinks(src) });

  it("flags a door into a keyed page that carries none of a key the code around it holds", () => {
    const src =
      'const symbol = p.symbol;\n<Link to="/accounts" search={{ account: deskId }}>Back</Link>';
    expect(keyDrops([file(src)]).map((d) => d.key)).toEqual(["symbol"]);
  });

  it("never flags a carried key, a section that reads no key, a spread search or an app-level tab", () => {
    const carried =
      'const symbol = s;\n<Link to="/trade" search={{ symbol, desk: deskId }}>Trade</Link>';
    const viewer =
      'const symbol = s;\n<Link to="/accounts" search={{ section: "milestones" }}>Milestones</Link>';
    const spread =
      'const symbol = s;\n<Link to="/trade" search={(prev) => ({ ...prev, section: "chain" })}>Chain</Link>';
    expect(keyDrops([file(carried), file(viewer), file(spread)])).toEqual([]);
    expect(
      keyDrops([file(carried.replace("symbol, ", ""))], {
        appLevel: new Set(["app/src/shell/x.tsx"]),
      }),
    ).toEqual([]);
  });
});

describe("homeless parts and routes", () => {
  const graph = new Map<string, string[]>([
    [
      "app/src/routes/index.tsx",
      ["app/src/shell/mission-windows.tsx", "app/src/shell/new-thing.tsx"],
    ],
    ["app/src/shell/mission-windows.tsx", ["app/src/shell/party-row.tsx"]],
    ["app/src/shell/new-thing.tsx", []],
    ["app/src/shell/party-row.tsx", []],
    ["app/src/shell/orphan.tsx", []],
  ]);
  const ia = "the Party window (`mission-windows.tsx`) and the route `index.tsx`";

  it("places a part the IA cites, or one under a cited part; never through a cited route", () => {
    const r = placeParts(
      [
        { file: "app/src/shell/mission-windows.tsx", scope: "feat(landing)" },
        { file: "app/src/shell/party-row.tsx", scope: "feat(landing)" },
        { file: "app/src/shell/new-thing.tsx", scope: "feat(landing)" },
        { file: "app/src/shell/orphan.tsx", scope: "feat(x)" },
      ],
      graph,
      ia,
    );
    expect(r.map((p) => p.status)).toEqual(["placed", "placed", "homeless", "not mounted"]);
    expect(r[1]?.via).toBe("mission-windows.tsx");
  });

  it("resolves relative imports and reads /api paths from literals", () => {
    const exists = (p: string) => p === "app/src/live/quests.ts";
    expect(importsOf("app/src/shell/a.tsx", 'import { q } from "../live/quests";', exists)).toEqual(
      ["app/src/live/quests.ts"],
    );
    expect(apiPaths('fetch("/api/quests/taken?x=1"); path === "/api/campaigns/mine/"')).toEqual([
      "/api/quests/taken",
      "/api/campaigns/mine",
    ]);
  });
});

describe("the ledger and the ratchet", () => {
  it("counts a §10 row open unless its status says it closed", () => {
    const ia = [
      "## 10. Upstream problems",
      "",
      "| # | Root | Screens | Why | Workaround | Status |",
      "|---|---|---|---|---|---|",
      "| U1 | **One history, three homes** — x | a | b | none | **ready for an overhaul plan** (3 screens) |",
      "| U2 | **Gone** | a | b | none | closed by #1 |",
    ].join("\n");
    expect(ledgerRows(ia).map((r) => [r.id, r.root, r.open])).toEqual([
      ["U1", "One history, three homes", true],
      ["U2", "Gone", false],
    ]);
  });

  it("flags a rise without failing, lowers a budget on a fall and never raises one", () => {
    const budget = {
      labelCollisions: 8,
      multiHomeConcepts: 6,
      keyDrops: 2,
      homeless: 28,
      openLedgerRows: 17,
    };
    const now = {
      labelCollisions: 9,
      multiHomeConcepts: 5,
      keyDrops: 2,
      homeless: 28,
      openLedgerRows: 17,
    };
    expect(
      againstBudget(now, budget)
        .filter((v) => v.rose)
        .map((v) => v.measure),
    ).toEqual(["labelCollisions"]);
    expect(lowered(now, budget)).toMatchObject({ labelCollisions: 8, multiHomeConcepts: 5 });
    expect(lowered(now, null)).toEqual(now);
  });
});
