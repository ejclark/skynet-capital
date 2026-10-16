import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";
import { schemaProblems } from "../../scripts/study/schema-check.mjs";
import {
  makeCaller,
  readSchema,
  redactImages,
  stubPick,
  userMessage,
} from "../../scripts/study/sealed.mjs";

// The one door every blind role answers through (scripts/study/sealed.mjs): its message shape,
// the stub that stands in for the CLI in a dry run, what a recorded request keeps, and the schema
// check that holds a stub to what the real CLI would enforce. No real call is ever made here.

describe("userMessage", () => {
  it("puts the text first, then each image after its own label", () => {
    const m = userMessage("hello", [{ label: "[F1]", b64: "QQ==" }, { b64: "Qg==" }]);
    expect(m.message.content.map((b) => b.type)).toEqual(["text", "text", "image", "image"]);
    expect(m.message.content[1]).toEqual({ type: "text", text: "[F1]" });
  });
});

describe("redactImages", () => {
  it("records an image as its sha256 and size, never its bytes", () => {
    const m = redactImages(userMessage("t", [{ b64: Buffer.from("abc").toString("base64") }]));
    expect(m.message.content[1]).toEqual({
      type: "image",
      sha256: "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
      bytes: 3,
    });
  });
});

describe("stubPick", () => {
  it("answers call n from n.json, else repeats the last one below it", () => {
    expect(stubPick([1, 2], 2)).toEqual({ n: 2, repeated: false });
    expect(stubPick([1, 2], 5)).toEqual({ n: 2, repeated: true });
    expect(stubPick([2], 1)).toBeNull();
    expect(stubPick([], 1)).toBeNull();
  });
});

describe("schemaProblems", () => {
  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["a", "list"],
    properties: {
      a: { type: "string", enum: ["x", "y"] },
      n: { type: "integer", minimum: 0, maximum: 4 },
      list: { type: "array", minItems: 1, maxItems: 2, items: { type: "number" } },
    },
  };

  it("passes a fitting value", () => {
    expect(schemaProblems(schema, { a: "x", n: 2, list: [1.5] })).toEqual([]);
  });

  it("names every way a value breaks it", () => {
    expect(schemaProblems(schema, { a: "z", n: 5, list: [], extra: 1 })).toEqual([
      '$.a: "z" is not one of ["x","y"]',
      "$.n: above 4",
      "$.list: fewer than 1 items",
      "$: unexpected extra",
    ]);
    expect(schemaProblems(schema, { list: ["s", 1, 2] })).toEqual([
      "$: missing a",
      "$.list: more than 2 items",
      "$.list[0]: expected number, got string",
    ]);
    expect(schemaProblems(schema, [])).toEqual(["$: expected object, got array"]);
  });

  it("holds every committed role schema to well-formed JSON with a required list", () => {
    for (const name of ["canary", "framer", "task-author", "analyst", "expert", "words"]) {
      const s = JSON.parse(readSchema(name));
      expect(s.type).toBe("object");
      expect(s.required.length).toBeGreaterThan(0);
    }
  });
});

describe("makeCaller with a stub", () => {
  const schema = readSchema("canary");
  const setup = () => {
    const dir = mkdtempSync(join(tmpdir(), "study-stub-spec-"));
    mkdirSync(join(dir, "canary"));
    writeFileSync(join(dir, "canary", "1.json"), JSON.stringify({ knowledge: "", context: [] }));
    mkdirSync(join(dir, "framer"));
    writeFileSync(join(dir, "framer", "1.json"), JSON.stringify({ knowledge: 7 }));
    return dir;
  };

  it("answers in order, repeats past the last file, and records each request", async () => {
    const dir = setup();
    try {
      const call = makeCaller({ stub: dir, record: join(dir, "rec") });
      const message = userMessage("q", [{ b64: "QQ==" }]);
      const one = await call({ role: "canary", rolePath: "/roles/a.md", schema, message });
      const two = await call({ role: "canary", rolePath: "/roles/b.md", schema, message });
      expect(one).toEqual({ knowledge: "", context: [] });
      expect(two).toEqual(one);
      expect(readdirSync(join(dir, "rec")).sort()).toEqual(["canary-001.json", "canary-002.json"]);
      const rec = JSON.parse(readFileSync(join(dir, "rec", "canary-002.json"), "utf8"));
      expect(rec).toMatchObject({ role: "canary", n: 2, rolePath: "/roles/b.md", repeated: true });
      expect(rec.args).toContain("--safe-mode");
      expect(rec.message.message.content[1]).toEqual(expect.objectContaining({ bytes: 1 }));
      expect(JSON.stringify(rec)).not.toContain("QQ==");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("refuses a stub answer the schema would refuse, and a role with no stub at all", async () => {
    const dir = setup();
    try {
      const call = makeCaller({ stub: dir, record: join(dir, "rec") });
      const message = userMessage("q");
      await expect(call({ role: "framer", rolePath: "/r", schema, message })).rejects.toThrow(
        /expected string/,
      );
      await expect(call({ role: "words", rolePath: "/r", schema, message })).rejects.toThrow(
        /no words\/1\.json/,
      );
      const rec = JSON.parse(readFileSync(join(dir, "rec", "framer-001.json"), "utf8"));
      expect(rec.error).toMatch(/expected string/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
