import { describe, expect, it } from "@rstest/core";
import { formWithReplaceId, parseFormSaveBody } from "../../src/server/save-body.js";

// The shared gate on a member's "save this form" request — `{ form, replaceId? }` — that the
// authored-play, chain and campaign save routes all answer with a 400 when it refuses. Governed
// cycle 16 folded three pasted copies into it, so it is specced directly here rather than only
// through each route.

/** A stand-in for a surface's own strict form parser: accepts `{ name: string }` and nothing else. */
const parseForm = (raw: unknown): { readonly name: string } | undefined =>
  typeof raw === "object" && raw !== null && typeof (raw as { name?: unknown }).name === "string"
    ? { name: (raw as { name: string }).name }
    : undefined;

const MAX_ID = 8;

describe("a member's save-form body", () => {
  it("accepts a valid form with no replaceId as a new row", () => {
    expect(
      parseFormSaveBody(JSON.stringify({ form: { name: "wheel" } }), parseForm, MAX_ID),
    ).toEqual({ form: { name: "wheel" } });
  });

  it("carries a replaceId within the bound, so the member overwrites their own row", () => {
    const raw = JSON.stringify({ form: { name: "wheel" }, replaceId: "abc123" });
    expect(parseFormSaveBody(raw, parseForm, MAX_ID)).toEqual({
      form: { name: "wheel" },
      replaceId: "abc123",
    });
  });

  it("accepts a replaceId exactly at the bound", () => {
    const raw = JSON.stringify({ form: { name: "w" }, replaceId: "x".repeat(MAX_ID) });
    expect(parseFormSaveBody(raw, parseForm, MAX_ID)?.replaceId).toBe("x".repeat(MAX_ID));
  });

  it("refuses a replaceId one past the bound, rather than truncating it", () => {
    const raw = JSON.stringify({ form: { name: "w" }, replaceId: "x".repeat(MAX_ID + 1) });
    expect(parseFormSaveBody(raw, parseForm, MAX_ID)).toBeUndefined();
  });

  it("refuses an empty or non-string replaceId instead of treating it as a new row", () => {
    for (const replaceId of ["", 42, null, ["a"], { id: "a" }]) {
      const raw = JSON.stringify({ form: { name: "w" }, replaceId });
      expect(parseFormSaveBody(raw, parseForm, MAX_ID)).toBeUndefined();
    }
  });

  it("refuses a body whose form the surface's own parser rejects", () => {
    expect(
      parseFormSaveBody(JSON.stringify({ form: { name: 7 } }), parseForm, MAX_ID),
    ).toBeUndefined();
    expect(
      parseFormSaveBody(JSON.stringify({ replaceId: "abc" }), parseForm, MAX_ID),
    ).toBeUndefined();
  });

  it("refuses text that is not a JSON object", () => {
    for (const raw of ["", "not json", "[]", "null", '"form"', "42"]) {
      expect(parseFormSaveBody(raw, parseForm, MAX_ID)).toBeUndefined();
    }
  });

  it("ignores fields it does not own, leaving them to the route that reads them", () => {
    const body = { form: { name: "w" }, draft: true, extra: "x" };
    expect(formWithReplaceId(body, parseForm, MAX_ID)).toEqual({ form: { name: "w" } });
  });
});
