import { execFileSync } from "node:child_process";

// Handoff contract gate — every committed handoff (docs/handoffs/<slug>/) must satisfy the contract
// in docs/handoffs/TEMPLATE.md before anything can build from it. A malformed handoff is worse than
// no handoff: an unattended session would build the wrong thing from it and look green doing so.
// Static analysis — no network, no session, no test recursion.
describe("handoff contract", () => {
  it("every committed handoff satisfies the contract", () => {
    expect(() =>
      execFileSync("node", ["scripts/handoff-scan.mjs", "--validate"], {
        cwd: process.cwd(),
        stdio: "pipe",
      }),
    ).not.toThrow();
  });

  // The watcher workflow and the hourly Routine both read this one output. If its shape drifts,
  // the pickup silently stops working — which is exactly the failure a scheduled job hides best.
  it("--ready emits the JSON shape both pickup layers consume", () => {
    const out = execFileSync("node", ["scripts/handoff-scan.mjs", "--ready"], {
      cwd: process.cwd(),
      encoding: "utf8",
    });
    const ready = JSON.parse(out);
    expect(Array.isArray(ready)).toBe(true);
    for (const handoff of ready) {
      expect(handoff).toEqual(
        expect.objectContaining({
          slug: expect.any(String),
          title: expect.any(String),
          path: expect.any(String),
          readme: expect.any(String),
          files: expect.any(Array),
        }),
      );
    }
  });
});
