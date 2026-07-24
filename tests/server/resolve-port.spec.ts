import { resolvePort } from "../../src/server/resolve-port.js";

describe("resolvePort", () => {
  it("prefers PORT (what hosting platforms inject)", () => {
    expect(resolvePort({ PORT: "3000", SKYNET_DASHBOARD_PORT: "8787" })).toBe(3000);
  });

  it("falls back to SKYNET_DASHBOARD_PORT locally", () => {
    expect(resolvePort({ SKYNET_DASHBOARD_PORT: "9000" })).toBe(9000);
  });

  it("defaults to 8787 when nothing is set or the value is junk", () => {
    expect(resolvePort({})).toBe(8787);
    expect(resolvePort({ PORT: "not-a-number" })).toBe(8787);
  });
});
