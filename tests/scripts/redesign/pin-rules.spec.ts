import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";
import {
  contrast,
  type Drawn,
  imageSize,
  layoutProblems,
  manifestPins,
  PALETTE,
  paletteProblems,
  readPins,
} from "../../../scripts/redesign/pin-rules.mjs";
import { MAX_PIN_LABEL, pinProblems } from "../../../scripts/steer/pins.mjs";

// #5143: pin.mjs refuses a frame that breaks Eric's standing rules — text he can read on a phone,
// contrast a red/green colourblind reader can see, nothing cut off, badges that don't touch — and
// every refusal names the pin and the fix, so a session repairs it without a critic pass.

const frame = { width: 390, height: 1000 };
const badge = (n: number, x: number, y: number): Drawn => ({
  kind: "badge",
  n,
  rect: { x: x - 12, y: y - 12, w: 24, h: 24 },
  font: 13,
});
const label = (n: number, x: number, y: number, w: number, side = "right"): Drawn => ({
  kind: "label",
  n,
  side,
  rect: { x, y, w, h: 22 },
  font: 12.5,
});

describe("the pin palette", () => {
  it("holds AA in both schemes: text 4.5:1, badges and boxes 3:1", () => {
    expect(paletteProblems()).toEqual([]);
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
  });

  it("names the scheme and the part when a colour slips", () => {
    const light = { ...PALETTE.light, onAccent: "#ffffff" };
    expect(paletteProblems({ light })).toEqual([
      expect.stringMatching(/^palette \(light\): badge number is 3\.\d\d:1 — needs 4\.5:1$/),
    ]);
  });
});

describe("readPins", () => {
  it("numbers pins in order and puts the label on the right unless told", () => {
    const { pins, problems } = readPins({ pins: [{ x: 10, y: 10, label: "Cash hides here" }] });
    expect(problems).toEqual([]);
    expect(pins[0]).toMatchObject({ n: 1, side: "right" });
  });

  it("names each pin it can't draw, and why", () => {
    const { problems } = readPins({
      pins: [
        { x: 120, y: 10, label: "Off the frame" },
        { n: 1, x: 10, y: 10, label: "x".repeat(60), side: "middle" },
        { x: 10, y: 10, label: "Boxed", box: [90, 0, 20, 5] },
      ],
      quote: { text: "", at: [10] },
    });
    expect(problems).toEqual([
      'pin 1 ("Off the frame"): x and y are % of the frame, 0–100',
      expect.stringMatching(/^pin 1 \("x+"\): number 1 is used twice$/),
      expect.stringMatching(/: 60 characters — a pin label is a few words/),
      expect.stringMatching(/: side is one of right, left, top, bottom$/),
      'pin 3 ("Boxed"): box is [x, y, w, h] in % and stays inside the frame',
      "quote: needs text and who",
      "quote: at is [x, y] in % of the frame",
    ]);
    expect(readPins({}).problems).toEqual(["pins: nothing to draw"]);
  });

  it("names a list entry that isn't a pin at all, instead of throwing", () => {
    expect(readPins({ pins: [null, 7] }).problems).toEqual([
      'pin 1 (""): x and y are % of the frame, 0–100',
      "pin 1: needs a label — a few words on what is wrong here",
      'pin 2 (""): x and y are % of the frame, 0–100',
      "pin 2: needs a label — a few words on what is wrong here",
    ]);
  });
});

describe("layoutProblems", () => {
  it("passes a frame whose pins sit apart and inside it", () => {
    expect(layoutProblems([badge(1, 40, 40), label(1, 58, 29, 120)], frame)).toEqual([]);
  });

  it("names the pin whose label runs off the frame and the side to flip to", () => {
    expect(layoutProblems([badge(1, 300, 40), label(1, 318, 29, 140)], frame)).toEqual([
      `pin 1's label runs 68px past the right edge — set "side": "left" or shorten the label`,
    ]);
  });

  it("keeps 8px between badges and 12px text", () => {
    const small = { ...label(2, 200, 300, 60), font: 11 };
    expect(layoutProblems([badge(1, 40, 40), badge(2, 66, 40), small], frame)).toEqual([
      "pin 2's label text is 11px at 1x — 12px is the floor",
      "pins 1 and 2: badges 2px apart — keep 8px between them",
    ]);
  });

  it("refuses one callout covering another, and a quote leader landing on a label", () => {
    const quote: Drawn = {
      kind: "quote",
      rect: { x: 10, y: 400, w: 200, h: 50 },
      font: 12,
      at: { x: 70, y: 40 },
    };
    expect(
      layoutProblems([badge(1, 40, 40), label(1, 58, 29, 120), badge(2, 100, 40), quote], frame),
    ).toEqual([
      "pin 1's label covers pin 2's badge — move one, or flip a \"side\"",
      `the quote's leader ends on pin 1's label — point "at" at the spot itself`,
    ]);
  });
});

describe("imageSize", () => {
  it("reads a JPEG's size from its frame header and a PNG's from IHDR", () => {
    const jpeg = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x0a, 0x7a,
      0x03, 0x0c,
    ]);
    expect(imageSize(jpeg)).toEqual({ width: 780, height: 2682 });
    const png = Buffer.alloc(24);
    png.write("\x89PNG", 0, "latin1");
    png.writeUInt32BE(2560, 16);
    png.writeUInt32BE(3120, 20);
    expect(imageSize(png)).toEqual({ width: 2560, height: 3120 });
    expect(() => imageSize(Buffer.from("GIF89a"))).toThrow(/not a JPEG or PNG/);
  });
});

// Eric, 2026-10-11: a reaction on each pin. The manifest's `pins` is the JSON pin.mjs drew, so
// there is no second copy to keep in sync; `--emit-manifest-pins` prints it, defaults filled.
describe("manifestPins", () => {
  it("keeps what the page needs from the pins pin.mjs drew, defaults filled", () => {
    const { pins } = readPins({
      pins: [
        { x: 50, y: 12, label: "range strip", box: [4, 10, 92, 6] },
        { x: 30, y: 40, label: "order line", side: "left" },
      ],
      tag: "illustrative values",
    });
    const out = manifestPins(pins);
    expect(out).toEqual([
      { n: 1, x: 50, y: 12, label: "range strip", side: "right" },
      { n: 2, x: 30, y: 40, label: "order line", side: "left" },
    ]);
    expect(pinProblems(out, "q1 option B pins")).toEqual([]);
  });

  // #5244: pin.mjs refused a label past 48 while the page and the lint allowed 60, so a label could
  // pass one check and fail the other. Both read the one exported limit now.
  it("holds a label to the same limit the page and the lint read", () => {
    const at = (n: number) => ({ x: 10, y: 10, label: "x".repeat(n) });
    expect(readPins({ pins: [at(MAX_PIN_LABEL)] }).problems).toEqual([]);
    expect(pinProblems([{ n: 1, ...at(MAX_PIN_LABEL) }], "q1")).toEqual([]);
    expect(readPins({ pins: [at(MAX_PIN_LABEL + 1)] }).problems).toEqual([
      expect.stringMatching(
        new RegExp(`: ${MAX_PIN_LABEL + 1} characters — .*≤${MAX_PIN_LABEL}\\)`),
      ),
    ]);
    expect(pinProblems([{ n: 1, ...at(MAX_PIN_LABEL + 1) }], "q1")).toEqual([
      `q1 pin 1: label is ${MAX_PIN_LABEL + 1} characters — keep it to ${MAX_PIN_LABEL}`,
    ]);
  });

  it("is what `pin.mjs --emit-manifest-pins` prints, and it refuses a pins file it can't draw", () => {
    const dir = mkdtempSync(join(tmpdir(), "pin-emit-"));
    const file = join(dir, "pins.json");
    const run = () =>
      spawnSync(
        process.execPath,
        ["scripts/redesign/pin.mjs", "--pins", file, "--emit-manifest-pins"],
        { encoding: "utf8" },
      );
    writeFileSync(file, JSON.stringify({ pins: [{ x: 50, y: 12, label: "range strip" }] }));
    const ok = run();
    expect(ok.status).toBe(0);
    expect(JSON.parse(ok.stdout)).toEqual([
      { n: 1, x: 50, y: 12, label: "range strip", side: "right" },
    ]);
    writeFileSync(file, JSON.stringify({ pins: [{ x: 150, y: 12, label: "range strip" }] }));
    const bad = run();
    expect(bad.status).toBe(1);
    expect(bad.stderr).toContain('pin 1 ("range strip"): x and y are % of the frame');
  });
});
