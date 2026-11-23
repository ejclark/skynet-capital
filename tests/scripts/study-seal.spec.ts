import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";
import { bundleHash, keyPage, readKey, readPage, unpack } from "../../scripts/study/seal.mjs";

// The sealed key travels between cloud sessions as one private page (#8005 slice 4): packed by the
// session that seals a study, unpacked by the one that grades it, only against the hash posted on
// the issue, and never into a repo. The key here is the stub's stand-in (made-up items), never a
// real one.

const STUB = join(import.meta.dirname, "../fixtures/study-stub/sealed");
const files = readKey(STUB);
const page = keyPage({ name: "stand-in", files });

describe("packing a key", () => {
  it("carries every file of the folder, and keeps the key's words out of the page's text", () => {
    expect(files.map((f) => f.name)).toEqual(["gold.md", "keywords.txt", "primes.json"]);
    const gold = readFileSync(join(STUB, "gold.md"), "utf8");
    const line = gold.split("\n").find((l) => l.includes("A1 ")) ?? "";
    expect(line.length).toBeGreaterThan(5);
    expect(page).not.toContain(line);
    expect(page).toContain(bundleHash(files));
  });

  it("hashes the names and contents, not their order", () => {
    expect(bundleHash([...files].reverse())).toBe(bundleHash(files));
    const changed = files.map((f, i) => (i === 0 ? { ...f, sha256: "0".repeat(64) } : f));
    expect(bundleHash(changed)).not.toBe(bundleHash(files));
  });
});

describe("unpacking a key", () => {
  const out = () => join(mkdtempSync(join(tmpdir(), "study-seal-")), "key");
  const outside = () => false;

  it("writes the files back byte for byte when the hash is the issue's", () => {
    const dir = out();
    unpack({ html: page, expect: bundleHash(files), out: dir, checkout: outside });
    for (const f of files) {
      expect(readFileSync(join(dir, f.name))).toEqual(readFileSync(join(STUB, f.name)));
    }
  });

  it("refuses another hash, a changed page, and a folder inside a checkout", () => {
    expect(() =>
      unpack({ html: page, expect: "f".repeat(64), out: out(), checkout: outside }),
    ).toThrow(/not the f+ the issue carries/);
    const block = /id="sealed-key">([^<]+)</.exec(page)?.[1] ?? "";
    const bundle = JSON.parse(Buffer.from(block, "base64").toString("utf8"));
    bundle.files[0].b64 = Buffer.from("tampered").toString("base64");
    const tampered = page.replace(block, Buffer.from(JSON.stringify(bundle)).toString("base64"));
    expect(() => readPage(tampered)).toThrow(/does not match its own hash/);
    expect(() =>
      unpack({ html: page, expect: bundleHash(files), out: out(), checkout: () => true }),
    ).toThrow(/inside a git checkout/);
  });

  it("refuses a page with no key in it", () => {
    expect(() => readPage("<title>x</title>")).toThrow(/holds no sealed key/);
  });
});
