import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import type { ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isResearchDocPath, serveResearchDoc } from "../../src/server/research-page-routes.js";

interface Written {
  status?: number;
  headers?: Record<string, string>;
  body?: string;
}

function fakeRes(): { res: ServerResponse; out: Written } {
  const out: Written = {};
  const res = {
    writeHead(status: number, headers: Record<string, string>) {
      out.status = status;
      out.headers = headers;
      return res;
    },
    end(body?: string | Buffer) {
      out.body = body?.toString() ?? "";
    },
  } as unknown as ServerResponse;
  return { res, out };
}

/** A disposable docs/research tree, mirroring research-service.spec.ts's fixture shape. */
function fixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "research-page-"));
  mkdirSync(join(root, "events"));
  writeFileSync(join(root, "alpha-study.md"), "# Alpha study\n\nSome prose.\n");
  writeFileSync(
    join(root, "events", "nvda-2026-08-26-print.md"),
    "# NVDA earnings print — ledger\n\n**Last assessed:** 2026-08-15\n\n## At a glance\n\n**TL;DR.** Stand aside.\n\n## Initial research\n\nBody.\n",
  );
  return root;
}

describe("isResearchDocPath", () => {
  it("matches document sub-paths but not the bare shelf-listing path", () => {
    expect(isResearchDocPath("/research/alpha-study")).toBe(true);
    expect(isResearchDocPath("/research/events/nvda-2026-08-26-print")).toBe(true);
    expect(isResearchDocPath("/research")).toBe(false);
  });
});

describe("serveResearchDoc", () => {
  it("renders a known document's title, glance header and body", () => {
    const root = fixtureRoot();
    const { res, out } = fakeRes();
    serveResearchDoc(res, "/research/events/nvda-2026-08-26-print", root);
    expect(out.status).toBe(200);
    expect(out.body).toContain("<title>NVDA earnings print — ledger");
    expect(out.body).toContain("Stand aside");
    expect(out.body).toContain("Body.");
    expect(out.body).toContain('href="/app/research"');
  });

  it("404s a slug with no matching document, never guessing a path", () => {
    const root = fixtureRoot();
    const { res, out } = fakeRes();
    serveResearchDoc(res, "/research/no-such-doc", root);
    expect(out.status).toBe(404);
  });

  it("404s a traversal attempt instead of reading outside the shelf", () => {
    const root = fixtureRoot();
    const { res, out } = fakeRes();
    serveResearchDoc(res, "/research/../../etc/passwd", root);
    expect(out.status).toBe(404);
  });
});
