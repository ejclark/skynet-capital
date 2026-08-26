import { renderStandingsContent } from "../../src/observatory/standings-view.js";
import { BOARD_PATCH_SCRIPT, BOARD_PATCH_STYLE } from "../../src/server/board-patch-client.js";

/**
 * The client half has no DOM here, so it is pinned the way the other inline scripts in this repo
 * are: on the invariants whose loss is a real, previously-shipped defect — the TS1005 backtick
 * trap, a reduced-motion branch that swallows the update along with the animation, and the
 * innerHTML-per-tick regression this whole channel exists to remove.
 */
describe("the board patch client", () => {
  it("stays safely embeddable inside the page's TS template literal (CLAUDE.md TS1005 trap)", () => {
    expect(BOARD_PATCH_SCRIPT).not.toContain("`");
    expect(BOARD_PATCH_SCRIPT).not.toMatch(/\$\{/);
  });

  it("never swaps the board from the stream — the only innerHTML is the /board/frame fallback", () => {
    const swaps = BOARD_PATCH_SCRIPT.match(/innerHTML/g) ?? [];
    expect(swaps).toHaveLength(1);
    expect(BOARD_PATCH_SCRIPT).toContain("fetch('/board/frame'");
  });

  it("drops a patch it has already applied — the replay idempotency guard", () => {
    expect(BOARD_PATCH_SCRIPT).toContain("if (patch.seq <= lastSeq) return;");
  });

  it("takes one fresh frame on a seq gap rather than patching around a hole", () => {
    expect(BOARD_PATCH_SCRIPT).toContain("patch.seq !== lastSeq + 1");
    expect(BOARD_PATCH_SCRIPT).toContain("if (!applyOps(patch.ops) || gap) reframe();");
  });

  it("writes the value on the same line for every reader; reduced motion only skips the flash", () => {
    // The assignment is in setText, unguarded. The ONLY early return for reduced motion is inside
    // flash() — a still reader must never be left holding a stale number.
    expect(BOARD_PATCH_SCRIPT).toContain("el.textContent = value; flash(el);");
    const reducedGuards = BOARD_PATCH_SCRIPT.match(/if \(reduced\) return;/g) ?? [];
    expect(reducedGuards).toHaveLength(1);
    expect(BOARD_PATCH_SCRIPT).toContain("function flash(el) {\n    if (reduced) return;");
  });

  it("has a second reduced-motion net in CSS, and rests on the NEW value either way", () => {
    expect(BOARD_PATCH_STYLE).toContain("@media (prefers-reduced-motion:reduce)");
    // The keyframe only fades opacity in — killing it leaves the correct text on screen.
    expect(BOARD_PATCH_STYLE).toContain("from{ opacity:.4; } to{ opacity:1; }");
  });

  it("reorders by MOVING rows, so node identity (and any animation on it) survives a rank change", () => {
    expect(BOARD_PATCH_SCRIPT).toContain("list.appendChild(rows[j]);");
    expect(BOARD_PATCH_SCRIPT).toContain("rows[n].classList.remove('rank-top'");
  });

  it("delivers ceremony cues as an event and gives them no visual treatment of its own", () => {
    expect(BOARD_PATCH_SCRIPT).toContain("new CustomEvent('skynet:cue'");
    expect(BOARD_PATCH_SCRIPT).not.toContain("confetti");
  });

  it("attaches after the document is parsed — the 2026-08-20 dead-script regression", () => {
    expect(BOARD_PATCH_SCRIPT).toContain("document.readyState === 'loading'");
    expect(BOARD_PATCH_SCRIPT).toContain("DOMContentLoaded");
  });

  it("addresses the attributes the board actually renders", () => {
    const html = renderStandingsContent(
      {
        generatedAt: "2026-08-26T15:00:00.000Z",
        collisions: [],
        participants: [
          {
            id: "human-eric",
            displayName: "Eric",
            kind: "human",
            cash: 1_000,
            equity: 10_000,
            positions: [],
          },
        ],
      },
      { metric: "equity" },
    );
    for (const attr of ["data-field-key", "data-field", "data-field-bar", "data-sortable"]) {
      expect(html).toContain(attr);
      expect(BOARD_PATCH_SCRIPT).toContain(attr);
    }
  });
});
