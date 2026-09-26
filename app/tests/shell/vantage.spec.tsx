import { act, render } from "@testing-library/react";
import { useRef } from "react";
import { crestFromUrl, shellFromUrl, usePrefs } from "../../src/shell/prefs";
import { CREST_SRC, crestSrc, TowerSlot, VantageFrame } from "../../src/shell/vantage";

/**
 * The crest's one window (#3807 slice 3a): ONE `/tower?frame=crown` frame for the session, laid over
 * the band's slot — the same element across navigations, hidden (never unmounted) where it does not
 * belong, and absent entirely until the flag asks for it.
 */
function Shell({ pathname, phone, band }: { pathname: string; phone: boolean; band: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  return (
    <div ref={root}>
      {band ? (
        <section className="cal-head">
          <TowerSlot />
        </section>
      ) : null}
      <VantageFrame root={root} pathname={pathname} phone={phone} />
    </div>
  );
}

const frames = (c: HTMLElement) => c.querySelectorAll(`iframe[src="${CREST_SRC}"]`);
const settle = async (): Promise<void> => {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 40));
  });
};

describe("the shell flag", () => {
  it("?shell=watchtower sets it, ?shell=off clears it, anything else keeps what is stored", () => {
    expect(shellFromUrl("?shell=watchtower", undefined)).toBe("watchtower");
    expect(shellFromUrl("?shell=off", "watchtower")).toBe(undefined);
    expect(shellFromUrl("?on=2026-09-28", "watchtower")).toBe("watchtower");
    expect(shellFromUrl("", undefined)).toBe(undefined);
  });

  it("stamps data-shell on the page root while on", () => {
    act(() => usePrefs.getState().setShell("watchtower"));
    expect(document.documentElement.getAttribute("data-shell")).toBe("watchtower");
    act(() => usePrefs.getState().setShell(undefined));
    expect(document.documentElement.hasAttribute("data-shell")).toBe(false);
  });
});

describe("the crest's src (#3807 slice 3a-2)", () => {
  it("asks the scene for quality=presence", () => {
    expect(CREST_SRC).toBe("/tower?frame=crown&quality=presence");
    expect(crestSrc("")).toBe(CREST_SRC);
  });

  it("forwards ?probe=1 from the page, and nothing else", () => {
    expect(crestSrc("?shell=watchtower&probe=1")).toBe(`${CREST_SRC}&probe=1`);
    expect(crestSrc("?probe=0&power=1")).toBe(CREST_SRC);
  });
});

describe("the crest's rest (#3807 slice 3a-3)", () => {
  it("?crest=still picks the still crest, ?crest=live today's, anything else keeps what is stored", () => {
    expect(crestFromUrl("?shell=watchtower&crest=still", undefined)).toBe("still");
    expect(crestFromUrl("?crest=live", "still")).toBe("live");
    expect(crestFromUrl("?on=2026-09-28", "still")).toBe("still");
    expect(crestFromUrl("", undefined)).toBe("live");
    expect(crestFromUrl("?crest=STILL", undefined)).toBe("live");
  });

  it("a still crest asks the scene for rest=still; live asks for nothing new", () => {
    expect(crestSrc("", "still")).toBe(`${CREST_SRC}&rest=still`);
    expect(crestSrc("?probe=1", "still")).toBe(`${CREST_SRC}&rest=still&probe=1`);
    expect(crestSrc("", "live")).toBe(CREST_SRC);
  });

  it("the frame the shell mounts carries the viewer's choice, and it survives navigation", async () => {
    act(() => {
      usePrefs.getState().setShell("watchtower");
      usePrefs.getState().setCrest("still");
    });
    const view = render(<Shell pathname="/accounts" phone={false} band />);
    await settle();
    const still = () => view.container.querySelectorAll(`iframe[src="${CREST_SRC}&rest=still"]`);
    expect(still()).toHaveLength(1);
    view.rerender(<Shell pathname="/research" phone={false} band />);
    await settle();
    expect(still()).toHaveLength(1);
    act(() => {
      usePrefs.getState().setCrest("live");
      usePrefs.getState().setShell(undefined);
    });
  });
});

describe("VantageFrame", () => {
  afterEach(() => act(() => usePrefs.getState().setShell(undefined)));

  it("renders nothing, and the band no slot, with the flag off", async () => {
    const { container } = render(<Shell pathname="/accounts" phone={false} band />);
    await settle();
    expect(frames(container)).toHaveLength(0);
    expect(container.querySelector("[data-tower-slot]")).toBeNull();
  });

  it("keeps ONE frame — the same element — across navigations, hidden where there is no band", async () => {
    act(() => usePrefs.getState().setShell("watchtower"));
    const view = render(<Shell pathname="/accounts" phone={false} band />);
    await settle();
    const first = frames(view.container)[0];
    expect(frames(view.container)).toHaveLength(1);
    expect(first?.getAttribute("data-shown")).toBe("true");

    view.rerender(<Shell pathname="/leaderboard" phone={false} band={false} />);
    await settle();
    expect(frames(view.container)).toHaveLength(1);
    expect(frames(view.container)[0]).toBe(first);
    expect(first?.getAttribute("data-shown")).toBe("false");

    view.rerender(<Shell pathname="/research" phone={false} band />);
    await settle();
    expect(frames(view.container)).toHaveLength(1);
    expect(frames(view.container)[0]).toBe(first);
    expect(first?.getAttribute("data-shown")).toBe("true");
  });

  it("hides on Settings even if a band were there", async () => {
    act(() => usePrefs.getState().setShell("watchtower"));
    const view = render(<Shell pathname="/accounts" phone={false} band />);
    await settle();
    view.rerender(<Shell pathname="/settings" phone={false} band />);
    await settle();
    expect(frames(view.container)[0]?.getAttribute("data-shown")).toBe("false");
  });

  it("never mounts a frame at ≤860px — no WebGL on the phone", async () => {
    act(() => usePrefs.getState().setShell("watchtower"));
    const view = render(<Shell pathname="/accounts" phone band />);
    await settle();
    expect(frames(view.container)).toHaveLength(0);
  });

  it("is decorative: out of the tab order and hidden from assistive tech", async () => {
    act(() => usePrefs.getState().setShell("watchtower"));
    const view = render(<Shell pathname="/accounts" phone={false} band />);
    await settle();
    const f = frames(view.container)[0] as HTMLIFrameElement;
    expect(f.tabIndex).toBe(-1);
    expect(f.getAttribute("aria-hidden")).toBe("true");
  });
});
