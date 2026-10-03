import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { advisoryScan } from "../support/advisory-scan.js";

// Mermaid skill fitness gate — runs the real scanner (scripts/mermaid-skill-scan.mjs) so the /mermaid
// skill can't drift from what github.com draws. The budget check is advisory (debt class, see
// tests/support/advisory-scan.ts); the fixture specs below test the tool itself and stay blocking.
const SCRIPT = join(process.cwd(), "scripts/mermaid-skill-scan.mjs");

type Finding = { where: string; row?: string; text: string };
type Report = {
  pin: string;
  counts: { stale: number; unpromoted: number; uncarded: number };
  findings: Record<"stale" | "unpromoted" | "uncarded", Finding[]>;
};

const EMPHASIS = (lines: string) =>
  `## Emphasis without hue (the colourblind rule)\n${lines}\n\n## Styling hooks\n`;
const card = (table: string, emphasis: string, status = "**Status:** stable.") =>
  `# demo\n\n${status}\n\n| Feature | Syntax | Note |\n|---|---|---|\n${table}\n\n${EMPHASIS(emphasis)}`;

type Seed = {
  cards?: Record<string, string>;
  registry?: string[] | null;
  pin?: string | null;
  ledger?: unknown;
  skill?: string;
};

/** Seed a fixture repo, run the scanner with `args`; return exit status and output. */
function scan(seed: Seed, args: string[] = ["--json"]): { status: number; out: string } {
  const root = mkdtempSync(join(tmpdir(), "mermaid-skill-fixture-"));
  try {
    const ref = join(root, ".claude/skills/mermaid/reference");
    mkdirSync(ref, { recursive: true });
    writeFileSync(join(root, ".claude/skills/mermaid/SKILL.md"), seed.skill ?? "# /mermaid\n");
    for (const [name, body] of Object.entries(
      seed.cards ?? { "flowchart.md": card("| x | `a` |  |", "- shapes") },
    )) {
      writeFileSync(join(ref, name), body);
    }
    if (seed.ledger !== undefined) {
      writeFileSync(
        join(root, ".claude/skills/mermaid/encodings-ledger.json"),
        JSON.stringify(seed.ledger),
      );
    }
    if (seed.pin !== null) {
      mkdirSync(join(root, "scripts"), { recursive: true });
      writeFileSync(
        join(root, "scripts/mermaid-lint.mjs"),
        `export const GITHUB_MERMAID_VERSION = "${seed.pin ?? "11.17.2"}";\n`,
      );
    }
    if (seed.registry !== null) {
      const dist = join(root, "node_modules/mermaid/dist/chunks");
      mkdirSync(dist, { recursive: true });
      const ids = seed.registry ?? ["flowchart", "info"];
      writeFileSync(
        join(dist, "detectors.mjs"),
        ids.map((id, i) => `var id${i} = "${id}";`).join("\n"),
      );
    }
    try {
      return {
        status: 0,
        out: execFileSync("node", [SCRIPT, ...args], { cwd: root, encoding: "utf8" }),
      };
    } catch (err) {
      const e = err as { status: number; stdout?: string; stderr?: string };
      return { status: e.status, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
const report = (seed: Seed): Report => JSON.parse(scan(seed).out);

describe("mermaid skill drift budget (advisory)", () => {
  it("reports stale gates, unpromoted encodings and uncarded types without blocking CI", () => {
    advisoryScan(SCRIPT);
  });
});

describe("① stale version gates", () => {
  it("flags a card that still calls GitHub's version unknown", () => {
    const r = report({
      cards: { "flowchart.md": card("", "- x", "GitHub's deployed Mermaid version is unknown.") },
    });
    expect(r.counts.stale).toBe(1);
    expect(r.findings.stale[0]?.where).toMatch(/flowchart\.md:3$/);
  });

  it("flags a feature deferred at a version the pin already covers", () => {
    const r = report({
      cards: {
        "flowchart.md": card(
          "",
          "- x",
          "Use collapsed subgraphs once the renderer is at v11.17 or later.",
        ),
      },
    });
    expect(r.counts.stale).toBe(1);
  });

  it("flags 'until that is known' even without naming GitHub in the sentence", () => {
    const r = report({
      cards: {
        "flowchart.md": card(
          "",
          "- x",
          "Until that is known, keep to features that parse on v11.13:",
        ),
      },
    });
    expect(r.counts.stale).toBe(1);
  });

  it("flags a hedge that guesses GitHub sits on an older renderer", () => {
    const r = report({
      cards: {
        "flowchart.md": card(
          "",
          "- x",
          "Older renderers (plausibly GitHub's) only know block-beta.",
        ),
      },
    });
    expect(r.counts.stale).toBe(1);
  });

  it("leaves a deferral above the pin alone — that gate is still true", () => {
    const r = report({
      cards: { "flowchart.md": card("", "- x", "Avoid usecase-beta: it needs v12.0.0.") },
    });
    expect(r.counts.stale).toBe(0);
  });

  it("leaves a fact about the validator's version alone", () => {
    const r = report({
      cards: {
        "flowchart.md": card(
          "",
          "- x",
          "The validator's Mermaid version is unknown but older than 11.15.",
        ),
      },
    });
    expect(r.counts.stale).toBe(0);
  });

  it("moves with the pin: the same deferral is live under an older pin", () => {
    const body = card("", "- x", "Avoid collapsed subgraphs (v11.17.0+).");
    expect(report({ cards: { "flowchart.md": body }, pin: "11.17.2" }).counts.stale).toBe(1);
    expect(report({ cards: { "flowchart.md": body }, pin: "11.13.0" }).counts.stale).toBe(0);
  });
});

describe("② unpromoted encodings", () => {
  // The regression that motivated the eye: edge animation sat in flowchart.md's syntax table,
  // validated, and its emphasis section never named it — so no picture ever used it.
  const animated = card(
    "| edge animation | `e1@{ animate: true }` |  |",
    "- Edge weight: `==>` thick",
  );

  it("flags an encoding row the emphasis section never names", () => {
    const r = report({ cards: { "flowchart.md": animated } });
    expect(r.counts.unpromoted).toBe(1);
    expect(r.findings.unpromoted[0]?.row).toBe("edge animation");
  });

  it("passes once the emphasis section names it", () => {
    const named = card(
      "| edge animation | `e1@{ animate: true }` |  |",
      "- Motion: edge animation marks the flow",
    );
    expect(report({ cards: { "flowchart.md": named } }).counts.unpromoted).toBe(0);
  });

  it("passes when the ledger records a decision with a reason", () => {
    const ledger = {
      decisions: [{ card: "flowchart.md", row: "edge animation", status: "declined", reason: "r" }],
    };
    expect(report({ cards: { "flowchart.md": animated }, ledger }).counts.unpromoted).toBe(0);
  });

  it("refuses a ledger decision with no reason — silence is not a decision", () => {
    const ledger = {
      decisions: [{ card: "flowchart.md", row: "edge animation", status: "declined" }],
    };
    const r = report({ cards: { "flowchart.md": animated }, ledger });
    expect(r.counts.unpromoted).toBe(1);
    expect(r.findings.unpromoted[0]?.text).toMatch(/reason/);
  });

  it("flags a card with no emphasis section at all", () => {
    const r = report({ cards: { "flowchart.md": "# demo\n\n| x | `a` |  |\n" } });
    expect(r.counts.unpromoted).toBe(1);
  });

  it("ignores rows that name no encoding", () => {
    const plain = card("| subgraph | `subgraph a ... end` |  |", "- shapes");
    expect(report({ cards: { "flowchart.md": plain } }).counts.unpromoted).toBe(0);
  });
});

describe("③ uncarded types", () => {
  it("flags a registered type with no card and maps aliases to one card", () => {
    const r = report({ registry: ["flowchart", "flowchart-v2", "flowchart-elk", "venn", "info"] });
    expect(r.counts.uncarded).toBe(1);
    expect(r.findings.uncarded[0]?.row).toBe("venn");
  });

  it("counts a multi-id type once (railroad and its grammar variants)", () => {
    const r = report({
      registry: ["flowchart", "railroad", "railroadAbnf", "railroadEbnf", "railroadPeg"],
    });
    expect(r.counts.uncarded).toBe(1);
  });
});

describe("honest degradation and the ratchet", () => {
  it("is UNKNOWN (exit 3) when the pin cannot be read", () => {
    expect(scan({ pin: null }, []).status).toBe(3);
  });

  it("is UNKNOWN (exit 3) when the mermaid registry cannot be read", () => {
    expect(scan({ registry: null }, []).status).toBe(3);
  });

  it("exits 1 when a count grows past an absent (zero) budget", () => {
    const r = scan({ registry: ["flowchart", "venn"] }, []);
    expect(r.status).toBe(1);
    expect(r.out).toMatch(/registered type `venn` has no card/);
  });
});
