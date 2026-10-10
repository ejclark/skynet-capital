import { publishClearance, targetedAnchor } from "../../src/shell/landing";

/**
 * The shared landing (#5022). The scroll and the mark are observed through the surfaces that use it
 * (`activity-table.spec.tsx`, `position-anchor.spec.tsx`); this covers the two pieces of it no
 * surface owns: reading an anchor out of the hash, and the sticky head telling every landing target
 * how far down it reaches — the number behind their `scroll-margin-top` (landing.css).
 */

describe("targetedAnchor", () => {
  it("reads the anchor with the asked-for prefix out of the hash, decoded", () => {
    expect(targetedAnchor("act-", "#act-ord-1")).toBe("act-ord-1");
    expect(targetedAnchor("pos-", "#pos-BRK%2EB")).toBe("pos-BRK.B");
  });

  it("ignores another surface's anchor, a bare prefix, and a malformed escape it cannot match", () => {
    expect(targetedAnchor("act-", "#pos-EEM")).toBeUndefined();
    expect(targetedAnchor("act-", "#act-")).toBeUndefined();
    expect(targetedAnchor("act-", "")).toBeUndefined();
    expect(targetedAnchor("act-", "#act-%E0%A4%A")).toBe("act-%E0%A4%A");
  });
});

describe("publishClearance — how far the sticky stack reaches", () => {
  const clearance = () => document.documentElement.style.getPropertyValue("--landing-clear");
  const head = (position: string, height: number): HTMLElement => {
    const el = document.createElement("div");
    el.style.position = position;
    el.style.top = "64px";
    Object.defineProperty(el, "offsetHeight", { configurable: true, value: height });
    document.body.append(el);
    return el;
  };
  afterEach(() => {
    document.body.innerHTML = "";
    document.documentElement.style.removeProperty("--landing-clear");
  });

  it("is the topbar above a sticking head plus the head's own height", () => {
    const undo = publishClearance(head("sticky", 245));
    expect(clearance()).toBe("309px");
    undo?.();
  });

  it("is only the topbar when the head scrolls away with the page (`.acct-head` at ≤860)", () => {
    const undo = publishClearance(head("static", 245));
    expect(clearance()).toBe("64px");
    undo?.();
  });

  it("is withdrawn when the head leaves the page, so the stylesheet's topbar default returns", () => {
    const undo = publishClearance(head("sticky", 190));
    expect(clearance()).toBe("254px");
    undo?.();
    expect(clearance()).toBe("");
  });
});
