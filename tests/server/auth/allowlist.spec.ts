import { isAllowedIdentity } from "../../../src/server/auth/allowlist.js";

const emails = new Set(["eric@gmail.com"]);
const logins = new Set(["ericclark"]);

describe("isAllowedIdentity", () => {
  describe("when the email is on the guest list", () => {
    it("admits the identity", () => {
      expect(isAllowedIdentity(emails, logins, "eric@gmail.com")).toBe(true);
    });

    it("admits regardless of the email's casing", () => {
      expect(isAllowedIdentity(emails, logins, "Eric@Gmail.COM")).toBe(true);
    });
  });

  describe("when only the login is on the guest list", () => {
    it("admits the identity with no email at all", () => {
      expect(isAllowedIdentity(emails, logins, undefined, "ericclark")).toBe(true);
    });

    it("admits regardless of the login's casing", () => {
      expect(isAllowedIdentity(emails, logins, undefined, "EricClark")).toBe(true);
    });

    it("admits even when the email is unrecognized", () => {
      expect(isAllowedIdentity(emails, logins, "stranger@gmail.com", "ericclark")).toBe(true);
    });
  });

  describe("when neither email nor login is on the guest list", () => {
    it("refuses an unrecognized identity", () => {
      expect(isAllowedIdentity(emails, logins, "stranger@gmail.com", "stranger")).toBe(false);
    });

    it("refuses an identity with no email and no login", () => {
      expect(isAllowedIdentity(emails, logins)).toBe(false);
    });

    it("refuses empty-string email and login rather than matching them", () => {
      expect(isAllowedIdentity(emails, logins, "", "")).toBe(false);
    });

    it("refuses everyone when both lists are empty", () => {
      expect(isAllowedIdentity(new Set(), new Set(), "eric@gmail.com", "ericclark")).toBe(false);
    });
  });
});
