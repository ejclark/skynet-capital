import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import type { ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isAppShellPath, serveAppShell } from "../../src/server/app-shell-routes.js";

/** The React shell's static route: inside-the-root or index.html, never anything else. */

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

describe("app shell static route", () => {
  let dist: string;

  beforeEach(() => {
    dist = mkdtempSync(join(tmpdir(), "app-dist-"));
    writeFileSync(join(dist, "index.html"), "<title>shell</title>");
    mkdirSync(join(dist, "static", "js"), { recursive: true });
    writeFileSync(join(dist, "static", "js", "index.abc123.js"), "console.log(1)");
  });

  afterEach(() => {
    rmSync(dist, { recursive: true, force: true });
  });

  it("claims exactly the /app namespace", () => {
    expect(isAppShellPath("/app")).toBe(true);
    expect(isAppShellPath("/app/anything/deep")).toBe(true);
    expect(isAppShellPath("/apple")).toBe(false);
    expect(isAppShellPath("/")).toBe(false);
  });

  it("serves a real hashed asset with its type and immutable caching", () => {
    const { res, out } = fakeRes();
    serveAppShell(res, "/app/static/js/index.abc123.js", { distDir: dist });
    expect(out.status).toBe(200);
    expect(out.headers?.["content-type"]).toContain("text/javascript");
    expect(out.headers?.["cache-control"]).toContain("immutable");
    expect(out.body).toBe("console.log(1)");
  });

  it("answers every non-file path with index.html — the SPA owns its routing", () => {
    for (const path of ["/app", "/app/", "/app/some/client/route"]) {
      const { res, out } = fakeRes();
      serveAppShell(res, path, { distDir: dist });
      expect(out.status).toBe(200);
      expect(out.headers?.["content-type"]).toContain("text/html");
      expect(out.body).toContain("shell");
    }
  });

  it("refuses traversal structurally — an escape resolves to the fallback, never a file outside", () => {
    writeFileSync(join(dist, "..", "secret.json"), "{}");
    for (const path of [
      "/app/../secret.json",
      "/app/%2e%2e/secret.json",
      "/app/static/../../secret.json",
    ]) {
      const { res, out } = fakeRes();
      serveAppShell(res, path, { distDir: dist });
      // Either the SPA fallback or nothing — never the file outside the root.
      expect(out.body).not.toBe("{}");
      expect(out.headers?.["content-type"]).toContain("text/html");
    }
    rmSync(join(dist, "..", "secret.json"), { force: true });
  });

  it("says plainly when the shell was never built", () => {
    const { res, out } = fakeRes();
    serveAppShell(res, "/app", { distDir: join(dist, "nope") });
    expect(out.status).toBe(404);
    expect(out.body).toContain("not built");
  });
});
