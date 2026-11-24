import { readFileSync } from "node:fs";
import { join } from "node:path";
import { brotliDecompressSync } from "node:zlib";
// @ts-expect-error plain .mjs script, no declarations
import { FACES } from "../../../scripts/shoot/mermaid-pairs-ink.mjs";

// The ink side's glyph check (#8217). `drawSlot` (scripts/shoot/mermaid-pairs-frame.mjs) fails a
// side by name when a label holds a character outside the face's `coverage`; that promise is only
// as true as the list. The list once named the range subset.py asked for, not what the subset kept,
// so ✕ passed the check and Chromium drew it in a system font. This spec reads every shipped woff2's
// own character map, so a list that claims a glyph a file lacks goes red here, not on Eric's phone.

const FONTS = "scripts/shoot/fonts";

type Face = { family: string; files: Record<string, string>; coverage: string };
const faces = FACES as Record<"serif" | "sans", Face>;

/** Read a UIntBase128 (WOFF2 §4.1) at `at`; returns the value and the next offset. */
function base128(buf: Buffer, at: number): [number, number] {
  let value = 0;
  for (let i = 0; i < 5; i++) {
    const byte = buf.readUInt8(at + i);
    value = value * 128 + (byte & 0x7f);
    if (!(byte & 0x80)) return [value, at + i + 1];
  }
  throw new Error("UIntBase128 longer than 5 bytes");
}

/** The sfnt `cmap` table out of a WOFF2 file: walk the table directory, inflate the one brotli
 *  stream, and slice the table out (tables sit back to back, each at its stored length). */
function woff2Cmap(file: Buffer): Buffer {
  if (file.toString("latin1", 0, 4) !== "wOF2") throw new Error("not a WOFF2 file");
  const numTables = file.readUInt16BE(12);
  let at = 48;
  let offset = 0;
  let cmap: { offset: number; length: number } | null = null;
  for (let t = 0; t < numTables; t++) {
    const flags = file.readUInt8(at++);
    const index = flags & 0x3f;
    let tag = ["cmap"][index] ?? (index === 10 ? "glyf" : index === 11 ? "loca" : String(index));
    if (index === 0x3f) {
      tag = file.toString("latin1", at, at + 4);
      at += 4;
    }
    const version = flags >> 6;
    let length: number;
    [length, at] = base128(file, at);
    const transformed = tag === "glyf" || tag === "loca" ? version === 0 : version !== 0;
    if (transformed) [length, at] = base128(file, at);
    if (tag === "cmap") cmap = { offset, length };
    offset += length;
  }
  if (!cmap) throw new Error("no cmap table");
  const stream = brotliDecompressSync(file.subarray(at, at + file.readUInt32BE(20)));
  return stream.subarray(cmap.offset, cmap.offset + cmap.length);
}

/** Every code point a cmap maps to a real glyph, from its format 4 and format 12 subtables. */
function mappedCodePoints(cmap: Buffer): Set<number> {
  const out = new Set<number>();
  const count = cmap.readUInt16BE(2);
  for (let r = 0; r < count; r++) {
    const sub = cmap.readUInt32BE(4 + r * 8 + 4);
    const format = cmap.readUInt16BE(sub);
    if (format === 4) {
      const segs = cmap.readUInt16BE(sub + 6) / 2;
      const ends = sub + 14;
      const starts = ends + segs * 2 + 2;
      const deltas = starts + segs * 2;
      const ranges = deltas + segs * 2;
      for (let s = 0; s < segs; s++) {
        const start = cmap.readUInt16BE(starts + s * 2);
        const end = cmap.readUInt16BE(ends + s * 2);
        const delta = cmap.readInt16BE(deltas + s * 2);
        const rangeAt = ranges + s * 2;
        const range = cmap.readUInt16BE(rangeAt);
        for (let c = start; c <= end && c !== 0xffff; c++) {
          let glyph: number;
          if (range === 0) glyph = (c + delta) & 0xffff;
          else {
            glyph = cmap.readUInt16BE(rangeAt + range + (c - start) * 2);
            if (glyph !== 0) glyph = (glyph + delta) & 0xffff;
          }
          if (glyph !== 0) out.add(c);
        }
      }
    } else if (format === 12) {
      const groups = cmap.readUInt32BE(sub + 12);
      for (let g = 0; g < groups; g++) {
        const at = sub + 16 + g * 12;
        const start = cmap.readUInt32BE(at);
        const end = cmap.readUInt32BE(at + 4);
        const first = cmap.readUInt32BE(at + 8);
        for (let c = start; c <= end; c++) if (first + (c - start) !== 0) out.add(c);
      }
    }
  }
  return out;
}

const hex = (c: number) => `U+${c.toString(16).toUpperCase().padStart(4, "0")}`;

/** The same class `drawSlot` builds: whatever it matches is outside the face. */
const outside = (coverage: string) => new RegExp(`[^${coverage}\\s]`, "gu");

describe("mermaid-pairs ink: each face's coverage is what its font files really carry", () => {
  for (const [id, face] of Object.entries(faces)) {
    for (const file of Object.values(face.files)) {
      it(`${id}: every code point its coverage admits has a glyph in ${file}`, () => {
        const has = mappedCodePoints(woff2Cmap(readFileSync(join(FONTS, file))));
        // The parse is real: the plain letters are there.
        expect(has.has(0x41)).toBe(true);
        expect(has.has(0x7a)).toBe(true);
        const admitted = new RegExp(`^[${face.coverage}]$`, "u");
        const missing: string[] = [];
        for (let c = 0; c <= 0xffff; c++) {
          if (c >= 0xd800 && c <= 0xdfff) continue;
          if (admitted.test(String.fromCodePoint(c)) && !has.has(c)) missing.push(hex(c));
        }
        expect(missing).toEqual([]);
      });
    }
  }

  it("fails a label with ✕ in either face, since neither file has the glyph", () => {
    for (const face of Object.values(faces))
      expect("✕ wrong if below strike".match(outside(face.coverage))).toEqual(["✕"]);
  });

  it("fails a non-breaking hyphen in Lato, which lacks it, but not in the serif, which has it", () => {
    const label = "non‑breaking";
    expect(label.match(outside(faces.sans.coverage))).toEqual(["‑"]);
    expect(label.match(outside(faces.serif.coverage))).toBeNull();
  });

  it("passes a plain label with Latin Extended-A and an arrow in both faces", () => {
    for (const face of Object.values(faces))
      expect("Yōtei → 50% · −2".match(outside(face.coverage))).toBeNull();
  });
});
