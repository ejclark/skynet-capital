import { execFileSync } from "node:child_process";

// Spec-gap fitness gate — every src file should be exercised by at least one spec. The committed
// budget (spec-gap-budget.json) counts files no spec imports and only ever ratchets DOWN
// (`npm run spec:gap -- --update` after backfilling). Static analysis — no test recursion.
describe("spec-gap budget", () => {
  it("untested src files stay within the committed budget", () => {
    expect(() =>
      execFileSync("./node_modules/.bin/harness-spec-gap-scan", [], {
        cwd: process.cwd(),
        stdio: "pipe",
      }),
    ).not.toThrow();
  });
});
