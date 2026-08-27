import { execFileSync } from "node:child_process";

// The deploy-split classifier: which pushes must redeploy the bots app. Driven through the real
// entrypoint (`--classify`, paths on stdin) the way every script spec here works — no `.d.ts`
// invented for an `.mjs` module. The stakes are asymmetric by design: a wrong `deploy` costs one
// redundant restart, a wrong `skip` strands the bots app on stale code against newer shared
// contracts with no signal anywhere. So these specs pin the BIAS, not just the mapping —
// everything ambiguous or mixed must land on `deploy`.
const classify = (paths: string[]): { deploy: boolean; reason: string } => {
  const out = execFileSync("node", ["scripts/bot-relevant.mjs", "--classify"], {
    input: paths.join("\n"),
    encoding: "utf8",
  });
  const [verdict, reason] = out.trim().split("\n");
  return { deploy: verdict === "deploy", reason: reason ?? "" };
};

describe("bot-relevant classifier (deploy split)", () => {
  it("skips a docs/markdown-only push — the 41-merges-a-day case the split exists for", () => {
    const verdict = classify([
      "docs/research/ai-hardware-constraints-aug-2026.md",
      "docs/IDEAS.md",
      "README.md",
    ]);
    expect(verdict.deploy).toBe(false);
    expect(verdict.reason).toContain("3 path(s)");
  });

  it("skips tests and workflow changes — never shipped in the image (.dockerignore)", () => {
    expect(
      classify(["tests/personas/sauron.spec.ts", ".github/workflows/pipeline.yml"]).deploy,
    ).toBe(false);
  });

  it("deploys on any src change — shared modules and frontend included (bias to over-deploy)", () => {
    for (const path of [
      "src/domain/types.ts",
      "src/alpaca/market-data-stream.ts",
      "src/observatory/board-view.ts",
      "src/personas/sauron-hardcore.ts",
    ]) {
      expect(classify([path]).deploy, `${path} must deploy bots`).toBe(true);
    }
  });

  it("deploys on dependency, image, and hosting-config changes", () => {
    for (const path of ["package-lock.json", "Dockerfile", "fly.bots.toml", ".nvmrc"]) {
      expect(classify([path]).deploy, `${path} must deploy bots`).toBe(true);
    }
  });

  it("deploys a MIXED push — one relevant path outvotes any number of irrelevant ones", () => {
    const verdict = classify(["docs/IDEAS.md", "tests/x.spec.ts", "src/domain/types.ts"]);
    expect(verdict.deploy).toBe(true);
    expect(verdict.reason).toContain("src/domain/types.ts");
  });

  it("skips an empty change set — nothing changed, nothing to deploy", () => {
    expect(classify([]).deploy).toBe(false);
  });

  it("fails OPEN: a broken invocation answers deploy, never skip", () => {
    const out = execFileSync("node", ["scripts/bot-relevant.mjs"], { encoding: "utf8" });
    expect(out.trim().split("\n")[0]).toBe("deploy");
    expect(out).toContain("fail-open");
  });
});
