import { issueBody, opaqueMemberId } from "../../src/server/feedback-service.js";

// The repo is public, so a filed issue's body is public. These specs are the privacy net for
// Eric's attribution ruling (2026-08-19): opaque id only — a member's name or email must never
// appear in an issue body again.
describe("feedback-service issue body", () => {
  const input = {
    kind: "bug" as const,
    title: "It broke",
    details: "the chart wobbled",
    area: "The calendar",
    submitterEmail: "Member@Example.com",
  };

  it("never leaks the submitter's email — only the opaque member marker", () => {
    const body = issueBody(input);

    expect(body).not.toContain("Member@Example.com");
    expect(body).not.toContain("member@example.com");
    expect(body).toContain(`member \`${opaqueMemberId(input.submitterEmail)}\``);
  });

  it("puts the metadata in a table, under the member's own words", () => {
    const body = issueBody(input);

    expect(body.indexOf("the chart wobbled")).toBeLessThan(body.indexOf("| **Kind** |"));
    expect(body).toContain("| **Kind** | 🐞 Bug |");
    expect(body).toContain("| **Where** | The calendar |");
  });

  it("omits the where row when the member didn't pick one", () => {
    expect(issueBody({ kind: "idea", title: "t", details: "d" })).not.toContain("**Where**");
  });

  it("derives a stable, case-insensitive member id", () => {
    expect(opaqueMemberId("Member@Example.com")).toBe(opaqueMemberId("  member@example.com "));
    expect(opaqueMemberId("member@example.com")).toHaveLength(10);
    expect(opaqueMemberId("other@example.com")).not.toBe(opaqueMemberId("member@example.com"));
  });

  it("still attributes anonymously when no email is on the session", () => {
    const body = issueBody({ kind: "idea", title: "t", details: "d" });

    expect(body).toContain("a league member");
  });
});
