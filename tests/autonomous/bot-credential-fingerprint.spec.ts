import { credentialFingerprint } from "../../src/autonomous/bot-credential-fingerprint.js";

describe("credentialFingerprint", () => {
  it("is stable for the same credentials and salt", () => {
    const creds = { apiKey: "KID", apiSecret: "SECRET" };
    expect(credentialFingerprint(creds, "salt")).toBe(credentialFingerprint(creds, "salt"));
  });

  it("changes when either the key or the secret changes", () => {
    const base = credentialFingerprint({ apiKey: "KID", apiSecret: "SECRET" }, "salt");
    expect(credentialFingerprint({ apiKey: "OTHER", apiSecret: "SECRET" }, "salt")).not.toBe(base);
    expect(credentialFingerprint({ apiKey: "KID", apiSecret: "OTHER" }, "salt")).not.toBe(base);
  });

  it("changes when the salt changes, even for the same credentials", () => {
    const creds = { apiKey: "KID", apiSecret: "SECRET" };
    expect(credentialFingerprint(creds, "salt-a")).not.toBe(credentialFingerprint(creds, "salt-b"));
  });

  it("never contains the raw key or secret as a substring", () => {
    const fp = credentialFingerprint(
      { apiKey: "MY-SECRET-KEY", apiSecret: "MY-SECRET-VALUE" },
      "s",
    );
    expect(fp).not.toContain("MY-SECRET-KEY");
    expect(fp).not.toContain("MY-SECRET-VALUE");
  });
});
