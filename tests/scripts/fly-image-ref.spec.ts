import { execFileSync } from "node:child_process";

// The image-reference resolver behind every rollback path in pipeline.yml. Driven through the real
// entrypoint (JSON on stdin) the way every script spec here works — no `.d.ts` invented for an
// `.mjs` module.
//
// These specs pin an ASYMMETRY, not just a mapping. Emitting nothing costs a rollback that was
// already impossible (there is no previous image to roll back to). Emitting a *plausible-looking*
// reference that does not exist costs the rollback itself: on run 33024006048 the old inline jq
// answered `null/null:null`, the workflow's `!= ''` guard read that as a real image, and the
// recovery step died on `Could not find image "docker.io/null/null:null"`. So every case that
// cannot name a real image must land on the empty string.
const ref = (payload: string): string =>
  execFileSync("node", ["scripts/fly-image-ref.mjs"], {
    input: payload,
    encoding: "utf8",
  }).trim();

describe("fly image reference resolver (rollback safety)", () => {
  it("REFUSES the all-null record — the `null/null:null` deploy that broke run 33024006048", () => {
    expect(ref(JSON.stringify({ Registry: null, Repository: null, Tag: null, Digest: null }))).toBe(
      "",
    );
  });

  it('refuses the literal string "null" in any component — the old jq\'s exact token', () => {
    expect(ref(JSON.stringify({ Registry: "null", Repository: "null", Tag: "null" }))).toBe("");
    expect(
      ref(JSON.stringify({ Registry: "registry.fly.io", Repository: "null", Tag: "v9" })),
    ).toBe("");
  });

  it("prefers the digest form — a digest pins the bits a moved tag would not", () => {
    const payload = JSON.stringify({
      Registry: "registry.fly.io",
      Repository: "skynet-capital-bots",
      Tag: "deployment-01J",
      Digest: "sha256:abc123",
    });
    expect(ref(payload)).toBe("registry.fly.io/skynet-capital-bots@sha256:abc123");
  });

  it("falls back to the tag form when there is no digest", () => {
    const payload = JSON.stringify({
      Registry: "registry.fly.io",
      Repository: "skynet-capital",
      Tag: "deployment-01J",
      Digest: "",
    });
    expect(ref(payload)).toBe("registry.fly.io/skynet-capital:deployment-01J");
  });

  it("unwraps an array payload — flyctl answers with either shape", () => {
    const payload = JSON.stringify([
      { Registry: "registry.fly.io", Repository: "skynet-capital", Digest: "sha256:def456" },
    ]);
    expect(ref(payload)).toBe("registry.fly.io/skynet-capital@sha256:def456");
  });

  it("refuses a partial record — a missing registry or repository names no image", () => {
    for (const partial of [
      { Repository: "skynet-capital", Tag: "v1" },
      { Registry: "registry.fly.io", Tag: "v1" },
      { Registry: "registry.fly.io", Repository: "skynet-capital" },
    ]) {
      expect(ref(JSON.stringify(partial)), `${JSON.stringify(partial)} names no image`).toBe("");
    }
  });

  it("answers silence for an empty payload, an empty array, and malformed JSON", () => {
    expect(ref("")).toBe("");
    expect(ref("[]")).toBe("");
    expect(ref("Error: no access token available")).toBe("");
  });

  it("always exits 0 — a first deploy with no previous image is normal, not a step failure", () => {
    // `set -e` in the workflow step would abort the whole job on a non-zero exit here.
    const status = execFileSync(
      "bash",
      ["-c", "node scripts/fly-image-ref.mjs </dev/null; echo $?"],
      { encoding: "utf8" },
    ).trim();
    expect(status).toBe("0");
  });
});
