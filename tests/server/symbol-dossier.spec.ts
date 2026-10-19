import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderDossier, symbolDossier } from "../../src/server/symbol-dossier.js";

// The symbol dossier (2026-10-18 audit): what the house already knows about a ticker, joined at
// read time so an agent reads it before researching or trading the name.
const NOW = "2026-10-18T15:00:00Z";

describe("symbolDossier — the real corpus", () => {
  const crwv = symbolDossier("crwv", NOW);

  it("joins the bots' pairs on the symbol and the convictions that steer them", () => {
    expect(crwv?.symbol).toBe("CRWV");
    expect(crwv?.pairs.map((p) => p.id)).toEqual(
      expect.arrayContaining(["CRWV-WHEEL", "CRWV-LONG-CALL"]),
    );
    expect(crwv?.convictions.map((c) => c.id)).toContain("ai-dip-2026-10");
  });

  it("renders its sections in one fixed order, so a change reads at a glance", () => {
    const headings = renderDossier(crwv ?? fail()).match(/^## .+$/gm) ?? [];
    expect(headings.map((h) => h.replace(/ \(.*$/, ""))).toEqual([
      "## The current stance",
      "## Next dated events",
      "## The bots' pairs on this symbol",
      "## Convictions steering those pairs",
      "## Open forward tests naming this symbol",
      "## Killed — never re-propose without new prints",
      "## Event ledgers, newest event first",
      "## Studies that name it",
    ]);
  });

  it("says plainly when the house knows nothing about a symbol", () => {
    expect(symbolDossier("ZZZZ", NOW)).toBeUndefined();
  });
});

describe("symbolDossier — a fixture shelf", () => {
  let root = "";
  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), "dossier-"));
    mkdirSync(join(root, "events"));
    mkdirSync(join(root, "forward-tests"));
    writeFileSync(
      join(root, "events", "crwv-2026-11-10-print.md"),
      "# CRWV earnings print\n\n## At a glance\n\nStand aside into the print.\n\n## Detail\n\nnot the stance\n",
    );
    writeFileSync(
      join(root, "multi-symbol-sweep.md"),
      [
        "# Sweep",
        "",
        "## Kill list — recorded so they are never re-proposed",
        "",
        "- **CRWV gap fade** — killed 2026-08-12.",
        "",
        "- **MSFT run-up** — killed too.",
        "",
        "## After the list",
        "",
        "- **CRWV not a kill** — outside the section.",
      ].join("\n"),
    );
    const header =
      "| # | Hypothesis | Prediction | Kill switch | Score by | Outcome |\n|---|---|---|---|---|---|";
    writeFileSync(
      join(root, "forward-tests", "crwv-2026-11-10-print.md"),
      `${header}\n| FT-crwv-2026-11-10-print-1 | h | p | k | 2026-10-01 | _open_ |\n| FT-crwv-2026-11-10-print-2 | h | p | k | 2026-10-02 | PASS — scored |\n`,
    );
    writeFileSync(
      join(root, "forward-tests", "legacy.md"),
      `${header}\n| FT-9 | CRWV realized move beats implied | p | k | 2026-11-17 | _open_ |\n| FT-10 | NVDA only | p | k | 2026-11-17 | _open_ |\n`,
    );
  });
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  it("quotes the nearest ledger's At a glance section as the stance, and nothing past it", () => {
    const d = symbolDossier("CRWV", NOW, root);
    expect(d?.glance?.md).toBe("Stand aside into the print.");
  });

  it("lists only kill-list entries that name the symbol, inside the kill list", () => {
    expect(symbolDossier("CRWV", NOW, root)?.killed).toEqual([
      "- **CRWV gap fade** — killed 2026-08-12.",
    ]);
  });

  it("lists open forward tests — its ledger's and the unowned legacy rows naming it — flagging overdue ones", () => {
    expect(symbolDossier("CRWV", NOW, root)?.forwardTests).toEqual([
      {
        event: "crwv-2026-11-10-print",
        id: "FT-crwv-2026-11-10-print-1",
        scoreBy: "2026-10-01",
        overdue: true,
      },
      { event: "legacy", id: "FT-9", scoreBy: "2026-11-17", overdue: false },
    ]);
  });
});

function fail(): never {
  throw new Error("expected a dossier");
}
