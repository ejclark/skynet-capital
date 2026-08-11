import { addShell, readBody } from "../../src/server/page-shell.js";

describe("addShell", () => {
  it("wraps inner content with the page title and brand mark", () => {
    const html = addShell("My Title", "<p>hello</p>");
    expect(html).toContain("<title>My Title</title>");
    expect(html).toContain("<p>hello</p>");
    expect(html).toContain("SKYNET");
  });

  it("adds the wide layout class only when asked", () => {
    expect(addShell("T", "x", true)).toContain('class="wrap wide"');
    expect(addShell("T", "x", false)).toContain('<div class="wrap">');
    // Default (omitted) behaves the same as explicit false.
    expect(addShell("T", "x")).toContain('<div class="wrap">');
  });
});

describe("readBody", () => {
  const fakeRequest = (chunks: string[]) => {
    return {
      on(event: string, cb: (...args: unknown[]) => void) {
        if (event === "data") {
          for (const chunk of chunks) cb(chunk);
        }
        if (event === "end") {
          cb();
        }
        return this;
      },
      destroy() {
        /* no-op — the fake has nothing to tear down */
      },
      // biome-ignore lint/suspicious/noExplicitAny: minimal IncomingMessage double for this test only
    } as any;
  };

  it("concatenates data chunks into the full body", async () => {
    const body = await readBody(fakeRequest(["displayName=", "Uncle+Joe"]));
    expect(body).toBe("displayName=Uncle+Joe");
  });

  it("rejects a body over the 1MB cap", async () => {
    const huge = "x".repeat(1_000_001);
    await expect(readBody(fakeRequest([huge]))).rejects.toThrow("body too large");
  });
});
