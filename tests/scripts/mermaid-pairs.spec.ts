import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// The before/after pairs shoot, driven through its real CLI the way every script spec here works —
// so the flag plumbing is covered and no `.d.ts` is invented for an `.mjs` module. It renders the
// committed fixture offline (pinned Mermaid from node_modules, the harness's own Chromium) and
// asserts on what a reader gets: a frame per mode, under the ≤100KB tree budget
// (docs/PICTURES.md), sane dimensions, and a sidecar that carries the caption for alt text.
//
// The render cases need a Chromium. The cloud image has one at /opt/pw-browsers; CI's `verify`
// job has none (its Playwright job is the e2e suite), so they skip there — honestly, by name —
// while the bad-input cases, which never open a browser, always run.

const SCRIPT = "scripts/shoot/mermaid-pairs.mjs";
const FIXTURE = "tests/fixtures/mermaid-pairs/example.json";
const BUDGET = 100 * 1024;

const run = (...args: string[]) =>
  spawnSync("node", [SCRIPT, ...args], { encoding: "utf8", timeout: 120_000 });

/** Ask the harness's own resolver, so this spec never carries a second copy of the path list. */
const probe = spawnSync(
  "node",
  [
    "--input-type=module",
    "-e",
    "const m = await import('./scripts/shoot/lib.mjs'); process.stdout.write(m.resolveChromium() ?? '')",
  ],
  { encoding: "utf8" },
);
const HAVE_CHROMIUM = probe.status === 0 && probe.stdout.trim() !== "";

/** Width × height read straight from a JPEG's start-of-frame marker. */
function sofDimensions(buf: Buffer): { width: number; height: number } {
  let i = 2;
  while (i + 9 < buf.length && buf[i] === 0xff) {
    const m = buf[i + 1] ?? 0;
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc)
      return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
    i += 2 + buf.readUInt16BE(i + 2);
  }
  throw new Error("no start-of-frame marker — not a baseline/progressive JPEG");
}

type Sidecar = {
  title: string;
  caption: string;
  alt: string;
  layout: "side" | "stacked";
  lint: Record<"before" | "after", { ok: boolean; problems: string[] }>;
  images: {
    mode: string;
    file: string;
    bytes: number;
    width: number;
    height: number;
    alt: string;
  }[];
};
const sidecar = (dir: string, id: string): Sidecar =>
  JSON.parse(readFileSync(join(dir, `${id}.json`), "utf8"));

const fresh = (tag: string) => mkdtempSync(join(tmpdir(), `mermaid-pairs-${tag}-`));

describe("mermaid-pairs: a bad input fails loudly and renders nothing", () => {
  it("names every missing field and writes no frame", () => {
    const dir = fresh("bad");
    const file = join(dir, "pairs.json");
    const pair = { id: "x", title: "t", before: { kind: "mermaid", source: "flowchart TD\n A" } };
    writeFileSync(file, JSON.stringify({ pairs: [{ ...pair, after: { kind: "mermaid" } }] }));
    const r = run(file, join(dir, "out"));
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("pairs[0].caption is missing or empty");
    expect(r.stderr).toContain("pairs[0].after.source is missing or empty");
    expect(r.stderr).toContain("nothing rendered");
    expect(readdirSync(dir)).toEqual(["pairs.json"]);
  });

  it("rejects a bare array, an unknown key and a bad flag by name", () => {
    const dir = fresh("shape");
    const file = join(dir, "pairs.json");
    writeFileSync(file, "[]");
    expect(run(file, dir).stderr).toContain(`got a bare array; wrap it as {"pairs": [...]}`);
    writeFileSync(file, JSON.stringify({ pairs: [{ id: "x", captoin: "typo" }] }));
    expect(run(file, dir).stderr).toContain("pairs[0].captoin: unknown key");
    const flags = run(FIXTURE, dir, "--mode", "sepia", "--quality", "0");
    expect(flags.status).toBe(2);
    expect(flags.stderr).toContain("--mode must be light|dark|both");
    expect(flags.stderr).toContain("--quality must be 1–100");
  });
});

describe.skipIf(!HAVE_CHROMIUM)("mermaid-pairs: the fixture renders offline", () => {
  const out = { both: "", side: "", stacked: "", broken: "" };

  beforeAll(() => {
    out.both = fresh("both");
    out.side = fresh("side");
    out.stacked = fresh("stacked");
    out.broken = fresh("broken");
    const broken = join(out.broken, "broken.json");
    writeFileSync(
      broken,
      JSON.stringify({
        pairs: [
          {
            id: "broken",
            title: "An unclosed bracket",
            caption: "The frame says it did not render.",
            before: { kind: "mermaid", source: "flowchart TD\n  A[start --> B[end]" },
            after: { kind: "mermaid", source: "flowchart TD\n  A[start] --> B[end]" },
          },
        ],
      }),
    );
    const runs = [
      run(FIXTURE, out.both),
      run(FIXTURE, out.side, "--layout", "side", "--mode", "light"),
      run(FIXTURE, out.stacked, "--layout", "stacked", "--mode", "light"),
      run(broken, out.broken, "--mode", "light"),
    ];
    for (const r of runs) if (r.status !== 0) throw new Error(`render failed:\n${r.stderr}`);
  }, 180_000);

  it("writes a light and a dark frame per pair, each within the 100KB tree budget", () => {
    for (const id of ["pr-picture", "platter"])
      for (const mode of ["light", "dark"]) {
        const bytes = statSync(join(out.both, `${id}-${mode}.jpg`)).size;
        expect(bytes).toBeGreaterThan(5 * 1024);
        expect(bytes).toBeLessThanOrEqual(BUDGET);
      }
  });

  it("has sane dimensions, and the sidecar reports the file's own", () => {
    for (const id of ["pr-picture", "platter"]) {
      const car = sidecar(out.both, id);
      expect(car.images.map((i) => i.mode)).toEqual(["light", "dark"]);
      for (const img of car.images) {
        const buf = readFileSync(join(out.both, img.file));
        const dims = sofDimensions(buf);
        expect(dims).toEqual({ width: img.width, height: img.height });
        expect(img.bytes).toBe(buf.length);
        expect(dims.width).toBeGreaterThanOrEqual(400);
        expect(dims.width).toBeLessThanOrEqual(1300);
        expect(dims.height).toBeGreaterThanOrEqual(200);
        expect(dims.height).toBeLessThanOrEqual(2400);
      }
    }
  });

  it("carries the title, caption and alt text in the sidecar, and every side passed lint", () => {
    const fixture = JSON.parse(readFileSync(FIXTURE, "utf8"));
    for (const pair of fixture.pairs) {
      const car = sidecar(out.both, pair.id);
      expect(car.title).toBe(pair.title);
      expect(car.caption).toBe(pair.caption);
      const words = pair.caption.replace(/`/g, "");
      expect(car.alt).toContain(words);
      for (const img of car.images) expect(img.alt).toContain(`GitHub ${img.mode} mode`);
      expect(car.lint.before.ok && car.lint.after.ok).toBe(true);
    }
  });

  it("honours --layout: stacked is narrower and taller than side for the same pair", () => {
    for (const id of ["pr-picture", "platter"]) {
      const side = sidecar(out.side, id);
      const stacked = sidecar(out.stacked, id);
      expect([side.layout, stacked.layout]).toEqual(["side", "stacked"]);
      const [s, t] = [side.images[0], stacked.images[0]];
      expect(t?.width).toBeLessThan(s?.width ?? 0);
      expect(t?.height).toBeGreaterThan(s?.height ?? 0);
    }
  });

  it("renders a did-not-render panel for a diagram that fails lint, never an empty box", () => {
    const car = sidecar(out.broken, "broken");
    expect(car.lint.before.ok).toBe(false);
    expect(car.lint.before.problems.join(" ")).toContain("will not parse it");
    expect(car.lint.after.ok).toBe(true);
    expect(statSync(join(out.broken, "broken-light.jpg")).size).toBeGreaterThan(5 * 1024);
  });
});
