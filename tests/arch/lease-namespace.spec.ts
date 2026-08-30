import { readFileSync } from "node:fs";

// A lease ref must live somewhere that accepts what it points at.
//
// PROVENANCE (2026-08-22): the lease was changed to point at an annotated tag object — correct, a
// tag is the one git primitive that carries its own date — while still being created under
// `refs/heads/`. A branch ref must point at a COMMIT, so GitHub answered every create with
// `Reference update failed (HTTP 422)` and the feedback lane could not claim anything for hours.
// Nothing caught it: the call only runs on a runner, and the notice blamed a phantom race.
//
// This is the offline stand-in — it reads the ref the claim actually writes and refuses the
// combination that cannot work.
//
// The `heads/` read/delete fallback that briefly existed for pre-migration leases was itself
// removed on 2026-08-29 (#916) once every such lease had long since aged past its 2h TTL — see
// git blame on this file for the version that pinned it.
const source = () => readFileSync("scripts/moneypenny/index.mjs", "utf8");

describe("claim lease ref namespace", () => {
  it("creates the lease under refs/tags, never refs/heads", () => {
    const created = [...source().matchAll(/`ref=refs\/(\w+)\/\$\{ref\}`/g)].map((m) => m[1]);

    expect(created).toContain("tags");
    expect(created).not.toContain("heads");
  });

  it("reads and releases the lease under refs/tags only", () => {
    const text = source();

    expect(text).toContain('readRef("tags")');
    expect(text).toContain("refs/tags/claim/${slug}");
    expect(text).not.toMatch(/readRef\("heads"\)/);
    expect(text).not.toMatch(/\["tags", "heads"\]/);
  });

  it("keeps pointing the lease at a stamped tag object, so it carries its own age", () => {
    expect(source()).toContain("claimStamp(slug, sha, nowMs)");
  });
});
