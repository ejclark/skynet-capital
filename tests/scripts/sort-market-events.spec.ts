import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// The repair tool for what `event-scan.mjs --validate` flags (#1341). Its one safety property is
// that a sort MOVES entries and changes NOTHING else — 141 reordered entries is a diff nobody can
// read, so review is not the guard and these specs are. Run against scratch files, never the
// committed table: the committed table's own order is covered by the arch gate.
const SCRIPT = join(process.cwd(), "scripts", "sort-market-events.mjs");

const ENTRIES = [
  { id: "zulu", date: "2026-01-05" },
  { id: "alpha", date: "2026-03-01" },
  { id: "bravo", date: "2026-01-05" },
  { id: "charlie", date: "2026-02-01" },
];

function writeFixture(dir: string, order: readonly { id: string; date: string }[]): string {
  const file = join(dir, "market-events-data.ts");
  const body = order
    .map(
      (e) =>
        `  {\n    id: "${e.id}",\n    date: "${e.date}",\n` +
        `    notes: "a multi-line entry, so a line-wise sort would shred it",\n  },`,
    )
    .join("\n");
  writeFileSync(
    file,
    `// a header comment\nexport const MARKET_EVENTS: readonly MarketEvent[] = [\n${body}\n];\n`,
  );
  return file;
}

function sort(file: string): string {
  return execFileSync("node", [SCRIPT, `--file=${file}`], {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: "pipe",
  });
}

function idsIn(file: string): string[] {
  const source = readFileSync(file, "utf8");
  const array = source.slice(source.indexOf("["), source.lastIndexOf("]") + 1);
  return (new Function(`return ${array};`)() as { id: string }[]).map((e) => e.id);
}

describe("sort-market-events", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "sort-market-events-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("orders entries by date, breaking ties on id", () => {
    const file = writeFixture(dir, ENTRIES);
    sort(file);
    expect(idsIn(file)).toEqual(["bravo", "zulu", "charlie", "alpha"]);
  });

  it("moves whole entries — every field and the surrounding source survive byte for byte", () => {
    const file = writeFixture(dir, ENTRIES);
    const before = readFileSync(file, "utf8");
    sort(file);
    const after = readFileSync(file, "utf8");

    expect(after).not.toEqual(before);
    expect(after.startsWith("// a header comment\n")).toBe(true);
    for (const entry of ENTRIES) {
      expect(after).toContain(`    id: "${entry.id}",\n    date: "${entry.date}",\n`);
    }
    // Same characters, different arrangement: nothing was dropped, duplicated, or rewritten.
    expect([...after].sort().join("")).toEqual([...before].sort().join(""));
  });

  it("is idempotent and says so rather than rewriting an already-sorted file", () => {
    const file = writeFixture(dir, ENTRIES);
    sort(file);
    const sorted = readFileSync(file, "utf8");

    expect(sort(file)).toContain("already in (date, id) order");
    expect(readFileSync(file, "utf8")).toEqual(sorted);
  });
});
