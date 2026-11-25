import { act, render } from "@testing-library/react";
import { useRef } from "react";
import { crestFromUrl, usePrefs } from "../../src/shell/prefs";
import { COLUMN_SRC, columnSrc, TowerSlot, VantageFrame } from "../../src/shell/vantage";

/**
 * The home screen's tower (#8189; the page's tower of #3977 before it): ONE `/tower?frame=card` frame
 * for the session, laid over the home's tower box — the same element across navigations, hidden
 * (never unmounted) on every other page, and never mounted at the tablet width or narrower.
 */
function Shell({ pathname, wide }: { pathname: string; wide: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  return (
    <div ref={root}>
      {pathname === "/" ? (
        <div className="home-tower">
          <TowerSlot />
        </div>
      ) : null}
      <VantageFrame root={root} pathname={pathname} wide={wide && pathname === "/"} />
    </div>
  );
}

const frames = (c: HTMLElement) => c.querySelectorAll(`iframe[src="${COLUMN_SRC}"]`);
const settle = async (): Promise<void> => {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 40));
  });
};

describe("the tower's src", () => {
  it("frames the scene for the column, at its full quality", () => {
    expect(COLUMN_SRC).toBe("/tower?frame=card");
    expect(columnSrc("")).toBe(COLUMN_SRC);
  });

  it("forwards ?probe=1 from the page, and nothing else", () => {
    expect(columnSrc("?probe=1")).toBe(`${COLUMN_SRC}&probe=1`);
    expect(columnSrc("?probe=0&power=1")).toBe(COLUMN_SRC);
  });
});

describe("the tower's rest (#3807 slice 3a-3)", () => {
  it("?crest=still picks the still tower, ?crest=live today's, anything else keeps what is stored", () => {
    expect(crestFromUrl("?crest=still", undefined)).toBe("still");
    expect(crestFromUrl("?crest=live", "still")).toBe("live");
    expect(crestFromUrl("?on=2026-09-28", "still")).toBe("still");
    expect(crestFromUrl("", undefined)).toBe("live");
    expect(crestFromUrl("?crest=STILL", undefined)).toBe("live");
  });

  it("a still tower asks the scene for rest=still; live asks for nothing new", () => {
    expect(columnSrc("", "still")).toBe(`${COLUMN_SRC}&rest=still`);
    expect(columnSrc("?probe=1", "still")).toBe(`${COLUMN_SRC}&rest=still&probe=1`);
    expect(columnSrc("", "live")).toBe(COLUMN_SRC);
  });

  it("the frame the shell mounts carries the viewer's choice, and it survives navigation", async () => {
    act(() => usePrefs.getState().setCrest("still"));
    const view = render(<Shell pathname="/" wide />);
    await settle();
    const still = () => view.container.querySelectorAll(`iframe[src="${COLUMN_SRC}&rest=still"]`);
    expect(still()).toHaveLength(1);
    view.rerender(<Shell pathname="/trade" wide />);
    await settle();
    expect(still()).toHaveLength(1);
    act(() => usePrefs.getState().setCrest("live"));
  });

  it("the member's Settings choice reaches a frame already mounted — same element, new src", async () => {
    const view = render(<Shell pathname="/" wide />);
    await settle();
    const first = frames(view.container)[0];
    expect(first).toBeDefined();
    act(() => usePrefs.getState().setCrest("still"));
    await settle();
    const now = view.container.querySelectorAll(`iframe[src="${COLUMN_SRC}&rest=still"]`);
    expect(now).toHaveLength(1);
    expect(now[0]).toBe(first);
    act(() => usePrefs.getState().setCrest("live"));
  });
});

describe("VantageFrame", () => {
  it("keeps ONE frame — the same element — across navigations, so the tower never reloads", async () => {
    const view = render(<Shell pathname="/" wide />);
    await settle();
    const first = frames(view.container)[0];
    expect(frames(view.container)).toHaveLength(1);
    expect(first?.getAttribute("data-shown")).toBe("true");

    view.rerender(<Shell pathname="/trade" wide />);
    await settle();
    expect(frames(view.container)).toHaveLength(1);
    expect(frames(view.container)[0]).toBe(first);

    view.rerender(<Shell pathname="/" wide />);
    await settle();
    expect(frames(view.container)[0]).toBe(first);
    expect(first?.getAttribute("data-shown")).toBe("true");
  });

  it("hides, never unmounts, on every page but the home (#8189 criterion 2)", async () => {
    const view = render(<Shell pathname="/" wide />);
    await settle();
    const first = frames(view.container)[0];
    for (const page of ["/accounts", "/trade", "/activity", "/research", "/settings"]) {
      view.rerender(<Shell pathname={page} wide />);
      await settle();
      expect(frames(view.container)[0]).toBe(first);
      expect(first?.getAttribute("data-shown")).toBe("false");
    }
  });

  it("never mounts a frame at the tablet width or narrower — the home shows its still there", async () => {
    const view = render(<Shell pathname="/" wide={false} />);
    await settle();
    expect(frames(view.container)).toHaveLength(0);
  });

  it("never mounts a frame on a page that is not the home", async () => {
    const view = render(<Shell pathname="/accounts" wide />);
    await settle();
    expect(frames(view.container)).toHaveLength(0);
  });

  it("is decorative: out of the tab order and hidden from assistive tech", async () => {
    const view = render(<Shell pathname="/" wide />);
    await settle();
    const f = frames(view.container)[0] as HTMLIFrameElement;
    expect(f.tabIndex).toBe(-1);
    expect(f.getAttribute("aria-hidden")).toBe("true");
  });
});
