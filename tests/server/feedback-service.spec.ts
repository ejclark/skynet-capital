import { issueBody, labelsFor, opaqueMemberId } from "../../src/server/feedback-issue.js";

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

// Provenance (2026-08-22). Before this, a filed issue recorded NOTHING about how it was written, so
// a fully-interrogated spec and a one-line paste looked identical to the build lane and both had
// to be treated as the vaguer one. The `curated` label plus the fenced spec block is what lets
// the lane build a curated ask unattended instead of routing it to Eric.
describe("feedback provenance", () => {
  const spec = {
    rounds: 2,
    criteria: ["When a member opens /feedback, the form shall span 900px."],
    assumptions: [],
    outOfScope: [],
    readiness: "spec-complete" as const,
  };

  it("labels a coach-written submission `curated`, and a bare one not", () => {
    expect(labelsFor({ kind: "feature", title: "t", details: "d", spec })).toEqual([
      "enhancement",
      "feedback",
      "curated",
    ]);
    expect(labelsFor({ kind: "feature", title: "t", details: "d" })).toEqual([
      "enhancement",
      "feedback",
    ]);
  });

  // The envelope check moved to intake: an ask that was always going to need Eric is flagged at the
  // form, so it costs a sentence instead of a whole build session discovering it (#449 spent 48
  // minutes and three of Eric's comments learning this the other way round).
  it("flags `needs-eric` at intake when the coach found an owner-only ask", () => {
    const labels = labelsFor({
      kind: "feature",
      title: "t",
      details: "d",
      spec: { ...spec, needsEric: "provisions a new API key" },
    });

    expect(labels).toContain("needs-eric");
  });

  // A partial capsule waits on the MEMBER, never on Eric — that is the whole point of the split.
  it("routes an unresolved ask to `needs-info`, not to Eric", () => {
    const labels = labelsFor({
      kind: "bug",
      title: "t",
      details: "d",
      spec: { ...spec, readiness: "partial", assumptions: ["never said which page"] },
    });

    expect(labels).toContain("needs-info");
    expect(labels).not.toContain("needs-eric");
  });

  it("emits the machine-readable spec block the build lane reads as the spec", () => {
    const body = issueBody({ kind: "feature", title: "t", details: "Wider form", spec });

    expect(body).toContain("**Acceptance criteria**");
    expect(body).toContain("```skynet-spec");
    expect(JSON.parse(body.split("```skynet-spec\n")[1]?.split("\n```")[0] ?? "{}")).toEqual(spec);
  });

  it("omits the spec block entirely for a bare submission", () => {
    expect(issueBody({ kind: "idea", title: "t", details: "just a thought" })).not.toContain(
      "skynet-spec",
    );
  });
});
