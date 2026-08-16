import { deriveKey, open, seal } from "../../src/storage/secure-envelope.js";

// At-rest encryption for the volume-backed stores. These assert the properties the callers
// actually depend on — a round trip, that ciphertext doesn't leak the plaintext, and that a
// wrong or missing key FAILS rather than silently returning something empty. The last one
// matters most: an allowlist that decodes to "no members" on a key mistake fails in the safe
// direction, but one that decodes to garbage-treated-as-empty would look identical to a
// legitimately empty list.
describe("secure envelope", () => {
  const key = deriveKey("a-test-secret");
  const payload = JSON.stringify({ emails: ["someone@example.com"] });

  it("round-trips JSON through an encrypted envelope", () => {
    const sealed = seal(payload, key);
    expect(sealed.enc).toBe(true);
    expect(open(sealed, key)).toBe(payload);
  });

  it("does not leave the plaintext readable in the envelope", () => {
    const sealed = seal(payload, key);
    expect(JSON.stringify(sealed)).not.toContain("someone@example.com");
  });

  it("stores plaintext, and says so, when there is no key", () => {
    const sealed = seal(payload, undefined);
    expect(sealed.enc).toBe(false);
    expect(open(sealed, undefined)).toBe(payload);
  });

  it("refuses to open an encrypted envelope without the key", () => {
    const sealed = seal(payload, key);
    expect(() => open(sealed, undefined, "allowlist")).toThrow(/allowlist is encrypted/);
  });

  it("refuses a wrong key rather than returning garbage", () => {
    const sealed = seal(payload, key);
    expect(() => open(sealed, deriveKey("a-different-secret"))).toThrow();
  });

  it("refuses a tampered ciphertext (GCM auth tag is checked)", () => {
    const sealed = seal(payload, key);
    const tampered = { ...sealed, data: Buffer.from("not-the-real-data").toString("base64") };
    expect(() => open(tampered, key)).toThrow();
  });

  it("derives a key only when a secret is given", () => {
    expect(deriveKey("x")).toBeInstanceOf(Buffer);
    expect(deriveKey(undefined)).toBeUndefined();
  });
});
