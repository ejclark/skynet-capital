import type { NavContext } from "../../src/observatory/dashboard-shell.js";
import { renderShell } from "../../src/observatory/dashboard-shell.js";
import { SHELL_STYLE } from "../../src/observatory/shell-style.js";
import { TOKEN_DECLS, TOKEN_HEX } from "../../src/ui/tokens.js";

const baseNav = (overrides: Partial<NavContext> = {}): NavContext => ({
  active: "board",
  canAdd: false,
  authed: false,
  ...overrides,
});

const GENERATED_AT = "2026-07-24T14:30:00Z";

describe("renderShell", () => {
  describe("when no nav context is supplied", () => {
    it("renders the bare embeddable body without a drawer", () => {
      const html = renderShell(undefined, "<p>content</p>", GENERATED_AT);

      expect(html).toContain('<div class="obs" id="root"><p>content</p></div>');
      expect(html).not.toContain("<aside");
      expect(html).not.toContain('<button class="drawer-toggle"');
      expect(html).not.toContain('<div class="app"');
    });

    it("still includes the shared design-token stylesheet", () => {
      const html = renderShell(undefined, "<p>content</p>", GENERATED_AT);

      expect(html).toContain("<style>");
      expect(html).toContain("color-scheme: dark");
    });
  });

  describe("when a nav context is supplied", () => {
    it("wraps the content in the push-drawer app shell", () => {
      const html = renderShell(baseNav(), "<p>board</p>", GENERATED_AT);

      expect(html).toContain('<div class="app" data-drawer="open">');
      expect(html).toContain('<div class="obs" id="root"><p>board</p></div>');
      expect(html).toContain('<aside class="drawer" id="drawer" aria-label="Navigation">');
    });

    it("renders the formatted generated-at timestamp in the stage meta", () => {
      const html = renderShell(baseNav(), "<p>board</p>", GENERATED_AT);

      expect(html).toContain("2026-07-24 14:30 UTC");
      expect(html).toContain('<span class="tag">PAPER · SANDBOX</span>');
    });

    it("includes the drawer toggle and its behavioral script", () => {
      const html = renderShell(baseNav(), "<p>board</p>", GENERATED_AT);

      expect(html).toContain('<button class="drawer-toggle" type="button"');
      expect(html).toContain('aria-controls="drawer"');
      expect(html).toContain('aria-expanded="true"');
      expect(html).toContain("obs-drawer");
    });

    it("always links the Board view and marks it active when active", () => {
      const html = renderShell(baseNav({ active: "board" }), "<p>x</p>", GENERATED_AT);

      expect(html).toContain('<a class="dnav-link active" href="/" aria-current="page">');
      expect(html).toContain("Board");
    });

    it("marks a non-Board active view as active instead of Board", () => {
      const html = renderShell(baseNav({ active: "learn" }), "<p>x</p>", GENERATED_AT);

      expect(html).toContain('<a class="dnav-link active" href="/learn" aria-current="page">');
      // Board link is present but not marked active (no "active" class, no aria-current).
      expect(html).toContain('<a class="dnav-link" href="/">');
    });

    it("omits leaderboard, bots, and compare links when the views are not yet enabled", () => {
      const html = renderShell(baseNav(), "<p>x</p>", GENERATED_AT);

      expect(html).not.toContain('href="/leaderboard"');
      expect(html).not.toContain('href="/bots-vs-humans"');
      expect(html).not.toContain('href="/compare"');
    });

    it("links leaderboard, bots, and compare when the corresponding flags are set", () => {
      const html = renderShell(
        baseNav({ hasLeaderboard: true, hasBots: true, hasCompare: true }),
        "<p>x</p>",
        GENERATED_AT,
      );

      expect(html).toContain('href="/leaderboard"');
      expect(html).toContain("Leaderboard");
      expect(html).toContain('href="/bots-vs-humans"');
      expect(html).toContain("Bots vs Humans");
      expect(html).toContain('href="/compare"');
      expect(html).toContain("Compare");
    });

    it("omits the You link when no current participant id is resolved", () => {
      const html = renderShell(baseNav({ currentId: undefined }), "<p>x</p>", GENERATED_AT);

      expect(html).not.toContain(">You<");
    });

    it("links the You tab to the viewer's profile when a current id is resolved", () => {
      const html = renderShell(baseNav({ currentId: "eric" }), "<p>x</p>", GENERATED_AT);

      expect(html).toContain('href="/u/eric"');
      expect(html).toContain(">You<");
    });

    it("escapes a current id that requires URL encoding in the profile link", () => {
      const html = renderShell(baseNav({ currentId: "a b" }), "<p>x</p>", GENERATED_AT);

      expect(html).toContain("/u/a%20b");
    });

    it("omits the account CTA when the viewer cannot add an account", () => {
      const html = renderShell(baseNav({ canAdd: false }), "<p>x</p>", GENERATED_AT);

      expect(html).not.toContain('class="dnav-cta"');
    });

    it('labels the CTA "Connect account" for a viewer with no resolved id', () => {
      const html = renderShell(
        baseNav({ canAdd: true, currentId: undefined }),
        "<p>x</p>",
        GENERATED_AT,
      );

      expect(html).toContain("Connect account");
      expect(html).not.toContain("Add account");
    });

    it('labels the CTA "Add account" for a viewer who already has a resolved id', () => {
      const html = renderShell(
        baseNav({ canAdd: true, currentId: "eric" }),
        "<p>x</p>",
        GENERATED_AT,
      );

      expect(html).toContain("Add account");
    });

    it("always includes a feedback link", () => {
      const html = renderShell(baseNav(), "<p>x</p>", GENERATED_AT);

      expect(html).toContain('href="/feedback"');
      expect(html).toContain("Feedback");
    });

    it("omits the sign-out link when the viewer is not authenticated", () => {
      const html = renderShell(baseNav({ authed: false }), "<p>x</p>", GENERATED_AT);

      expect(html).not.toContain('href="/logout"');
    });

    it("includes a sign-out link when the viewer is authenticated", () => {
      const html = renderShell(baseNav({ authed: true }), "<p>x</p>", GENERATED_AT);

      expect(html).toContain('href="/logout"');
      expect(html).toContain("Sign out");
    });
  });
});

describe("shell styling", () => {
  it("reuses the brand tokens rather than hard-coding a parallel palette", () => {
    expect(SHELL_STYLE).toContain("var(--accent)");
    expect(SHELL_STYLE).toContain("var(--pos)");
  });

  it("declares its tokens from the one source, never a duplicated hex", () => {
    // Unlike DESK_STYLE (which only ever references var(--accent) etc.), SHELL_STYLE is where the
    // `.obs`/`.app` scopes get their tokens in the first place — so TOKEN_DECLS's raw hexes are
    // expected here, exactly once each, sourced from src/ui/tokens.ts and nowhere hand-pasted again.
    expect(SHELL_STYLE).toContain(TOKEN_DECLS);
    const withoutDecls = SHELL_STYLE.split(TOKEN_DECLS).join("");
    expect(withoutDecls).not.toContain(TOKEN_HEX.accent);
  });

  it("is what renderShell actually injects", () => {
    const html = renderShell(undefined, "<p>x</p>", GENERATED_AT);

    expect(html).toContain(SHELL_STYLE);
  });
});
