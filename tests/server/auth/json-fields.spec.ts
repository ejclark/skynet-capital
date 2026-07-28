import { asString } from "../../../src/server/auth/json-fields.js";

describe("asString (untrusted JSON-field coercion)", () => {
  describe("when the field is a non-empty string", () => {
    it("passes it through untouched", () => {
      expect(asString("eric@gmail.com")).toBe("eric@gmail.com");
      expect(asString(" ")).toBe(" "); // whitespace is still a string — no trimming magic
    });
  });

  describe("when the field is an empty string", () => {
    it("treats it as absent", () => {
      expect(asString("")).toBeUndefined();
    });
  });

  describe("when the field is missing or null", () => {
    it("treats undefined as absent", () => {
      expect(asString(undefined)).toBeUndefined();
    });

    it("treats null as absent", () => {
      expect(asString(null)).toBeUndefined();
    });
  });

  describe("when a provider sends a non-string type", () => {
    it("refuses numbers rather than stringifying them", () => {
      expect(asString(42)).toBeUndefined();
      expect(asString(0)).toBeUndefined();
    });

    it("refuses booleans", () => {
      expect(asString(true)).toBeUndefined();
      expect(asString(false)).toBeUndefined();
    });

    it("refuses objects and arrays", () => {
      expect(asString({ email: "x" })).toBeUndefined();
      expect(asString(["x"])).toBeUndefined();
    });
  });
});
