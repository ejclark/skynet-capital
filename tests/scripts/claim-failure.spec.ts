import { execFileSync } from "node:child_process";

// The lease's failure vocabulary. Provenance (2026-08-22, issue #475): `claimHandoff` reported
// EVERY create failure as "lost the race to a concurrent claim", so three diagnosis rounds chased
// a phantom competitor while no lease existed at all and the real error — whatever the API said —
// was swallowed. A 422 is the lock working; anything else is a fault, and must read like one.
const reason = (err: { stderr?: string; message?: string }): string =>
  JSON.parse(
    execFileSync(
      "node",
      [
        "-e",
        `import("./scripts/postmaster.mjs").then((m) =>
           console.log(JSON.stringify(m.claimFailureReason(JSON.parse(process.argv[1])))))`,
        JSON.stringify(err),
      ],
      { encoding: "utf8" },
    ),
  );

describe("claim lease failure reasons", () => {
  it("names a genuine race as a race", () => {
    expect(reason({ stderr: "HTTP 422: Reference already exists" })).toBe(
      "lost the race to a concurrent claim",
    );
  });

  it("does not call a 422 a race when the message says otherwise", () => {
    // GitHub uses 422 for a bad sha and a ruleset refusal too; only "already exists" is the lock.
    const said = reason({ stderr: "HTTP 422: Object does not exist (…/git/refs)" });

    expect(said).toContain("could not create the lease");
    expect(said).toContain("Object does not exist");
    expect(said).not.toContain("race");
  });

  it("reports a permissions failure as a fault, not a race", () => {
    const said = reason({ stderr: "HTTP 403: Resource not accessible by integration" });

    expect(said).toContain("could not create the lease");
    expect(said).toContain("403");
    expect(said).not.toContain("race");
  });

  it("still says something when the error carries no text", () => {
    expect(reason({})).toContain("no error text");
  });
});
