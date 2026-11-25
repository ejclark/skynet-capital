import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
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
/** The same, with the embedded faces read from another directory (the broken-face case). */
const runWithFonts = (fontDir: string, ...args: string[]) =>
  spawnSync("node", [SCRIPT, ...args], {
    encoding: "utf8",
    timeout: 120_000,
    env: { ...process.env, MERMAID_PAIRS_FONT_DIR: fontDir },
  });

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
  natural: Record<"before" | "after", number>;
  naturalHeight: Record<"before" | "after", number>;
  phoneScreens: Record<"before" | "after", number | null>;
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
    const flags = run(FIXTURE, dir, "--mode", "sepia", "--quality", "0", "--look", "neon");
    expect(flags.status).toBe(2);
    expect(flags.stderr).toContain("--mode must be light|dark|both");
    expect(flags.stderr).toContain("--quality must be 1–100");
    expect(flags.stderr).toContain("--look must be live|ink");
    expect(run(FIXTURE, dir, "--face", "comic").stderr).toContain("--face must be serif|sans");
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

  it("measures how many 390 × 844 phone screens each drawing takes, and none for a table", () => {
    const pr = sidecar(out.both, "pr-picture");
    for (const side of ["before", "after"] as const) {
      const scale = Math.min(1, 390 / pr.natural[side]);
      const expected = Math.round(((scale * pr.naturalHeight[side]) / 844) * 100) / 100;
      expect(pr.phoneScreens[side]).toBeGreaterThan(0);
      expect(pr.phoneScreens[side]).toBe(expected);
    }
    const platter = sidecar(out.both, "platter");
    expect(platter.phoneScreens.before).toBeNull();
    expect(platter.phoneScreens.after).toBeGreaterThan(0);
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

type InkSidecar = Sidecar & {
  looks: Record<"before" | "after", "live" | "ink">;
  face: { id: string; family: string } | null;
  phone: Record<"before" | "after", number | null>;
  lint: Record<"before" | "after", { ok: boolean; problems: string[] }>;
  sheets: {
    side: string;
    face: string;
    file: string;
    bytes: number;
    width: number;
    phone: number;
  }[];
};

// The owned look (#3981): the same text, drawn by our renderer in ink with an embedded face. What a
// reader gets: GitHub's side untouched, our side named as ours, the image alone on disk at its own
// size with rule 13's number, a scope panel for a type ink does not dress, and no fallback face.
describe.skipIf(!HAVE_CHROMIUM)("mermaid-pairs --look ink: our renderer beside GitHub's", () => {
  const out = { ink: "", broken: "", brokenFonts: "" };
  let brokenRun: ReturnType<typeof run>;

  beforeAll(() => {
    out.ink = fresh("ink");
    out.broken = fresh("ink-broken");
    out.brokenFonts = fresh("ink-fonts");
    for (const f of ["ink-serif-regular", "ink-serif-bold", "lato-regular", "lato-bold"])
      writeFileSync(join(out.brokenFonts, `${f}.woff2`), "not a font");
    const r = run(FIXTURE, out.ink, "--look", "ink", "--face", "sans", "--mode", "light");
    if (r.status !== 0) throw new Error(`ink render failed:\n${r.stderr}`);
    brokenRun = runWithFonts(
      out.brokenFonts,
      FIXTURE,
      out.broken,
      "--look",
      "ink",
      "--mode",
      "light",
    );
  }, 180_000);

  it("draws the after side as ours and the before side as GitHub's, naming the face", () => {
    const car = sidecar(out.ink, "pr-picture") as InkSidecar;
    expect(car.looks).toEqual({ before: "live", after: "ink" });
    expect(car.face).toMatchObject({ id: "sans", family: "Lato" });
    expect(car.lint.after.ok).toBe(true);
  });

  it("writes the ink side alone, within budget, with rule 13's number for its own width", () => {
    const car = sidecar(out.ink, "pr-picture") as InkSidecar;
    expect(car.sheets).toHaveLength(1);
    const [sheet] = car.sheets;
    expect(sheet?.file).toBe("pr-picture-after-ink-sans.jpg");
    const buf = readFileSync(join(out.ink, sheet?.file ?? ""));
    expect(buf.length).toBe(sheet?.bytes);
    expect(buf.length).toBeLessThanOrEqual(BUDGET);
    expect(sofDimensions(buf).width).toBe(sheet?.width);
    const expected = Math.round(Math.min(1, 390 / car.natural.after) * 16 * 10) / 10;
    expect(sheet?.phone).toBe(expected);
    expect(car.phone.after).toBe(expected);
  });

  it("gives a type ink does not dress a panel that names the scope, never derived colours", () => {
    const car = sidecar(out.ink, "platter") as InkSidecar;
    expect(car.looks.after).toBe("ink");
    expect(car.lint.after.ok).toBe(false);
    expect(car.lint.after.problems.join(" ")).toContain("the ink look dresses flowcharts only");
    expect(car.sheets).toEqual([]);
  });

  it("stops with exit 5 and names the face when it does not load, writing no frame", () => {
    expect(brokenRun.status).toBe(5);
    expect(brokenRun.stderr).toContain('the face "Ink Serif"');
    expect(brokenRun.stderr).toContain("did not load");
    expect(readdirSync(out.broken).filter((f) => f.endsWith(".jpg"))).toEqual([]);
  });
});

// The live side's face (#3981, slice 2): Verdana is not in the cloud container, so the number rule 13
// prints used to come from a silent Times fallback. A reader now gets the face named beside the
// number, and a face that is missing stops the run instead of changing the number.
describe.skipIf(!HAVE_CHROMIUM)(
  "mermaid-pairs: the live side names its face and never falls back",
  () => {
    const FONTS = "scripts/shoot/fonts";
    const STAND_IN = "live-dejavu";
    const dirs = { good: "", missing: "", garbled: "", inkOnly: "", inkOnlyFonts: "" };
    let good: ReturnType<typeof run>;
    let missing: ReturnType<typeof runWithFonts>;
    let garbled: ReturnType<typeof runWithFonts>;
    let inkOnly: ReturnType<typeof runWithFonts>;

    beforeAll(() => {
      for (const k of Object.keys(dirs) as (keyof typeof dirs)[]) dirs[k] = fresh(`live-${k}`);
      good = run(FIXTURE, join(dirs.good, "out"), "--mode", "light");
      // The ink faces present, the stand-in absent: a run that draws a live side must stop.
      missing = runWithFonts(dirs.missing, FIXTURE, join(dirs.missing, "out"), "--mode", "light");
      for (const w of ["regular", "bold"])
        writeFileSync(join(dirs.garbled, `${STAND_IN}-${w}.woff2`), "x");
      garbled = runWithFonts(dirs.garbled, FIXTURE, join(dirs.garbled, "out"), "--mode", "light");
      // A table beside an ink diagram has no live diagram: the stand-in is never needed or read.
      const pairs = join(dirs.inkOnly, "pairs.json");
      writeFileSync(
        pairs,
        JSON.stringify({
          pairs: [
            {
              id: "ink-only",
              title: "Ink beside a table",
              caption: "No live diagram on this frame.",
              before: { kind: "markdown", source: "| a | b |\n|---|---|\n| 1 | 2 |" },
              after: {
                kind: "mermaid",
                source: "%% look: ink\nflowchart TD\n  A[start] --> B[end]",
              },
            },
          ],
        }),
      );
      for (const f of ["ink-serif-regular", "ink-serif-bold"])
        copyFileSync(join(FONTS, `${f}.woff2`), join(dirs.inkOnlyFonts, `${f}.woff2`));
      inkOnly = runWithFonts(
        dirs.inkOnlyFonts,
        pairs,
        join(dirs.inkOnly, "out"),
        "--mode",
        "light",
      );
    }, 240_000);

    it("prints the face beside rule 13's number, and the sidecar carries it", () => {
      expect(good.status).toBe(0);
      const shots = good.stdout.split("\n").filter((l) => l.startsWith("shot "));
      expect(shots).toHaveLength(2);
      for (const line of shots) expect(line).toContain("live face DejaVu Sans (Verdana stand-in)");
      const car = sidecar(join(dirs.good, "out"), "pr-picture") as Sidecar & {
        liveFace: { family: string; standIn: string } | null;
      };
      expect(car.liveFace).toMatchObject({ family: "Verdana", standIn: "DejaVu Sans" });
    });

    it("stops with exit 5 and names the face when its file is missing, writing no frame", () => {
      expect(missing.status).toBe(5);
      expect(missing.stderr).toContain('the face "Verdana"');
      expect(missing.stderr).toContain("could not be read");
      expect(readdirSync(join(dirs.missing)).filter((f) => f.endsWith(".jpg"))).toEqual([]);
    });

    it("stops with exit 5 when the face is there but will not load", () => {
      expect(garbled.status).toBe(5);
      expect(garbled.stderr).toContain('the face "Verdana"');
      expect(garbled.stderr).toContain("did not load");
    });

    it("neither loads nor names the stand-in for a frame with no live diagram", () => {
      expect(inkOnly.status).toBe(0);
      expect(inkOnly.stdout).not.toContain("live face");
      const car = sidecar(join(dirs.inkOnly, "out"), "ink-only") as Sidecar & { liveFace: unknown };
      expect(car.liveFace).toBeNull();
    });
  },
);
