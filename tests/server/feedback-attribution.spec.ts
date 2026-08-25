import {
  memberLabelFor,
  opaqueMemberId,
  submitterFor,
} from "../../src/server/feedback-attribution.js";

// Split out of feedback-issue.ts (2026-08-25) when the attribution amendment pushed that file
// over its architecture budget. feedback-service.spec.ts already exercises this behavior through
// issueBody/labelsFor's public surface; these specs cover the module directly.
describe("opaqueMemberId", () => {
  it("derives a stable, case-insensitive id from an email", () => {
    expect(opaqueMemberId("Member@Example.com")).toBe(opaqueMemberId("  member@example.com "));
    expect(opaqueMemberId("member@example.com")).toHaveLength(10);
  });

  it("gives two different members two different ids", () => {
    expect(opaqueMemberId("a@example.com")).not.toBe(opaqueMemberId("b@example.com"));
  });

  it("never contains the email itself", () => {
    expect(opaqueMemberId("member@example.com")).not.toContain("member@example.com");
  });
});

describe("memberLabelFor", () => {
  it("wraps the opaque id in the member- label prefix GitHub search filters on", () => {
    const email = "member@example.com";
    expect(memberLabelFor(email)).toBe(`member-${opaqueMemberId(email)}`);
  });
});

describe("submitterFor", () => {
  it("names the submitter alongside the id when a profile name is known", () => {
    expect(submitterFor({ submitterEmail: "member@example.com", submitterName: "Tony" })).toBe(
      `**Tony** (member \`${opaqueMemberId("member@example.com")}\`)`,
    );
  });

  it("falls back to the id alone with no profile name", () => {
    expect(submitterFor({ submitterEmail: "member@example.com" })).toBe(
      `member \`${opaqueMemberId("member@example.com")}\``,
    );
  });

  it("reads as anonymous with no email at all", () => {
    expect(submitterFor({})).toBe("a league member");
  });

  it("never leaks the raw email, named or not", () => {
    const named = submitterFor({ submitterEmail: "member@example.com", submitterName: "Tony" });
    const bare = submitterFor({ submitterEmail: "member@example.com" });

    expect(named).not.toContain("member@example.com");
    expect(bare).not.toContain("member@example.com");
  });
});
