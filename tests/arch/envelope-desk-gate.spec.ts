import { execFileSync } from "node:child_process";

// Split from envelope.spec.ts to stay under noExcessiveLinesPerFile — same reason
// envelope-behavior.spec.ts and envelope-coach-model.spec.ts are their own modules.
//
// #928 slice 3 — the sensitive capability (turning a raw credential factory into a usable
// client) was extracted whole into account-identity-gate.ts; everything downstream of a
// successful verification holds no raw factory and opens up alongside it.
const scan = (...args: string[]): string =>
  execFileSync("node", ["scripts/envelope-scan.mjs", ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

type Check = {
  path: string;
  protected: boolean;
  blocking: boolean;
  why?: string;
};
const check = (...paths: string[]): Check[] => JSON.parse(scan("--check", ...paths)) as Check[];

describe("autonomous-lane envelope — desk-execution seam (#928)", () => {
  it("leaves the desk-execution seam and the broker clients open, once the identity gate is extracted", () => {
    const openPaths = [
      "src/server/desk-gate.ts",
      "src/server/trade-service.ts",
      "src/server/option-trade-service.ts",
      "src/alpaca/alpaca-trading-client.ts",
      "src/alpaca/alpaca-options-client.ts",
      "src/alpaca/credentials.ts",
    ];
    for (const entry of check(...openPaths)) {
      expect(entry.protected, `${entry.path} must stay buildable`).toBe(false);
    }
  });

  it("keeps account-identity-gate.ts as the one hard-gated file in the cluster", () => {
    const [gate] = check("src/server/account-identity-gate.ts");
    expect(gate?.protected).toBe(true);
    expect(gate?.why).toContain("usable client");
  });
});
