import { readFileSync } from "node:fs";
import { describe, expect, it } from "@rstest/core";
import {
  buildLedger,
  evidenceOf,
  evidenceTable,
  LEDGER_JSON_PATH,
  ledgerText,
  memberRoute,
  plansIn,
  readLedgerInputs,
  rowOf,
  screensIn,
  stateOf,
} from "../../scripts/ia-ledger.mjs";

// The IA ledger's machine-readable copy (#8005 slice 7): Moneypenny reads `src/domain/ia-ledger.json`
// to match a member's ask to a problem already recorded in docs/IA.md §10, so the JSON must say
// what §10 says, and the parse must survive the table's real cells.

const REGISTRY = [
  { id: "trade-chain", name: "Trade: Chain", route: "/app/trade?symbol=NVDA&section=chain" },
  { id: "trade-ticket", name: "Trade: Ticket", route: "/app/trade?symbol=NVDA" },
  {
    id: "profile-activity",
    name: "Profile: Activity",
    route: "/app/accounts?account=sauron&section=ledger",
  },
];

describe("the IA ledger generator", () => {
  describe("when docs/IA.md §10 is read", () => {
    it("matches the committed JSON — run `npm run ia:ledger` when it does not", () => {
      const { ia, registry } = readLedgerInputs();
      const committed = JSON.parse(readFileSync(LEDGER_JSON_PATH, "utf8"));
      expect(committed, "src/domain/ia-ledger.json is stale: run npm run ia:ledger").toEqual(
        buildLedger(ia, registry),
      );
    });

    it("reads every U-row once, each with a title and at least one screen", () => {
      const { ia, registry } = readLedgerInputs();
      const rows = buildLedger(ia, registry).rows;
      expect(rows.length).toBeGreaterThanOrEqual(17);
      expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
      for (const row of rows) {
        expect(row.problem, row.id).not.toMatch(/\*|`/);
        expect(row.screens.length, row.id).toBeGreaterThan(0);
      }
    });

    it("fails loudly when the section is gone, rather than emptying what the chat reads", () => {
      expect(() => buildLedger("# IA\n\n## 9. Something else\n")).toThrow(/no '## 10\.' section/);
    });
  });

  describe("when a row's cells are parsed", () => {
    it("keeps both screens in a cell whose quote carries an unbalanced ')'", () => {
      const cell =
        'trade-chain (#5171 round 2: "options are available when 1) \\"buying stock\\" is selected, 2) options locked"), trade-ticket (#5174, the order form)';
      expect(screensIn(cell, REGISTRY).map((s) => s.id)).toEqual(["trade-chain", "trade-ticket"]);
    });

    it("drops the fixture account from a screen's route, so a member lands on their own", () => {
      expect(memberRoute("/app/accounts?account=sauron&section=ledger")).toBe(
        "/app/accounts?section=ledger",
      );
      expect(memberRoute("/app/accounts?account=eric")).toBe("/app/accounts");
    });

    it("reads the status cell's state and the plans that own the fix", () => {
      expect(stateOf("**filed as #5206** (7 screens)")).toBe("plan filed");
      expect(plansIn("**filed as #5206** (7 screens)")).toEqual([5206]);
      expect(stateOf("**ready for an overhaul plan** (3 screens)")).toBe("ready for a plan");
      expect(plansIn("waiting (1 screen; owned by #6949, #6948)")).toEqual([6949, 6948]);
      expect(stateOf("waiting (2 screens)")).toBe("waiting");
      expect(stateOf("**fixed in #8100** (3 screens)")).toBe("fixed");
    });

    it("reads fixed only from a cell that opens with it, never from the word elsewhere", () => {
      // The reviewer's probes (2026-11-23): each would have had her tell members it was fixed.
      expect(stateOf("waiting (1 screen; #5176 closed without a decision)")).toBe("waiting");
      expect(stateOf("waiting (2 screens; not fixed by #5448)")).toBe("waiting");
      expect(stateOf("half done in #7077")).toBe("waiting");
      expect(stateOf("**done in #8101**")).toBe("fixed");
    });

    it("reads a cell that opens **resolved** as fixed, with the first PR after it as the fix (#8080)", () => {
      // U17's real cell: it shipped as "waiting, no plan", so Moneypenny called a fixed row open.
      const cell =
        "**resolved** by #6952 slice 2b and #7034 — an uncovered question joins the queue";
      expect(stateOf(cell)).toBe("fixed");
      expect(rowOf(["U17", "**t**", "", "", "", cell], REGISTRY).fixedBy).toBe(6952);
      expect(stateOf("waiting (1 screen; not resolved by #5448)")).toBe("waiting");
    });

    it("ships every §10 row the doc marks resolved as fixed (#8080)", () => {
      const { ia, registry } = readLedgerInputs();
      const u17 = buildLedger(ia, registry).rows.find((r) => r.id === "U17");
      expect(u17?.state).toBe("fixed");
    });

    it("writes the JSON the way biome formats it, so a regenerate never trips lint", () => {
      const text = ledgerText({
        source: "s",
        rows: [
          { ...rowOf(["U1", "**t**", "trade-ticket", "", "", "**filed as #5206**"], REGISTRY) },
        ],
      });
      expect(text).toContain('"plans": [5206]');
      expect(text.endsWith("}\n")).toBe(true);
    });

    it("sends no committed screen route to a fixture account by query", () => {
      const { ia, registry } = readLedgerInputs();
      for (const row of buildLedger(ia, registry).rows) {
        for (const screen of row.screens) expect(screen.route, row.id).not.toContain("account=");
      }
    });

    it("builds a row from the table's own columns, with the gloss in plain words", () => {
      const row = rowOf(
        [
          "U9",
          "**A thing** — the `ledger` row (§5.4; `docs/x.md`) goes *stale* (13/13, §5.1) (src/a.ts:3)",
          "profile-activity (round 1), trade-ticket",
          "why",
          "none",
          "**fixed in #8100** (2 screens)",
        ],
        REGISTRY,
      );
      expect(row).toEqual({
        id: "U9",
        problem: "A thing",
        detail: "the ledger row goes stale",
        screens: [
          {
            id: "profile-activity",
            name: "Profile: Activity",
            route: "/app/accounts?section=ledger",
          },
          { id: "trade-ticket", name: "Trade: Ticket", route: "/app/trade?symbol=NVDA" },
        ],
        screensCited: 2,
        plans: [],
        state: "fixed",
        fixedBy: 8100,
      });
    });
  });

  describe("when the evidence is counted", () => {
    it("counts each member once by their member-<id> label, and skips pull requests", () => {
      const issues = [
        { labels: [{ name: "feedback" }, { name: "member-aa11" }, { name: "ia-U1" }] },
        { labels: [{ name: "member-aa11" }, { name: "ia-U1" }] },
        { labels: ["member-bb22", "ia-U1"] },
        { labels: [{ name: "ia-U1" }] },
        { pull_request: {}, labels: [{ name: "member-cc33" }] },
      ];
      expect(evidenceOf(issues)).toEqual({ members: 2, filings: 4 });
    });

    it("prints members beside the screens §10's overhaul rule reads, with a live list per row", () => {
      const { ia, registry } = readLedgerInputs();
      const ledger = buildLedger(ia, registry);
      const md = evidenceTable(ledger, new Map([["U1", { members: 2, filings: 3 }]]), "2026-11-23");
      expect(md).toContain("| Row | Problem | Screens | Members who asked | Filings |");
      expect(md).toMatch(/\| U1 \| One history, three homes \| 3 \| 2 \| 3 \|/);
      expect(md).toMatch(/\| U2 \| [^|]+ \| 3 \| 0 \| 0 \|/);
      expect(md).toContain("issues?q=label%3Aia-U1");
      expect(md).toContain("As of 2026-11-23");
    });
  });
});
