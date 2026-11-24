import { spawnSync } from "node:child_process";

/**
 * No member-facing string in app/src says a name Eric rejected (#8290, docs/plain-names.json).
 * scripts/plain-names-app.mjs parses each file and checks only what renders (JSX text, string
 * literals); identifiers, types, comments and import paths keep their names.
 */
const scan = (files: string[] = []) => {
  const r = spawnSync("node", ["scripts/plain-names-app.mjs", "--json", ...files], {
    encoding: "utf8",
  });
  return {
    status: r.status,
    hits: JSON.parse(r.stdout || "[]") as { found: string; plain: string; message: string }[],
  };
};

describe("member copy never says a rejected name", () => {
  it("fails a rejected name in a copy string and passes the same word as an identifier", () => {
    const { status, hits } = scan(["tests/fixtures/plain-names/copy.tsx"]);
    expect(status).toBe(1);
    expect(hits.map((h) => [h.found, h.plain])).toEqual([
      ["Desk", "Trade"],
      ["Garage", "Bots"],
    ]);
  });

  it("holds across app/src", () => {
    const { hits } = scan();
    expect(hits.map((h) => h.message)).toEqual([]);
  });
});
