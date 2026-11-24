import { PRESENCE_EVERY_MS, startPresencePings } from "../../src/live/presence";

/**
 * The in-view ping (#8319): the server counts a tab left open only when it says it is in view, so
 * a hidden tab must never send it, whatever its timer does.
 */

/** A document whose visibility the test sets, with the one event the ping listens to. */
function fakeDoc(initial: DocumentVisibilityState) {
  const target = new EventTarget();
  const doc = {
    visibilityState: initial,
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
  };
  const show = (state: DocumentVisibilityState) => {
    doc.visibilityState = state;
    target.dispatchEvent(new Event("visibilitychange"));
  };
  return { doc: doc as unknown as Document, show };
}

beforeEach(() => {
  rstest.useFakeTimers();
});
afterEach(() => {
  rstest.useRealTimers();
});

describe("startPresencePings — a ping only while the tab is in view", () => {
  it("sends nothing from a hidden tab, however long its timer runs", () => {
    const { doc } = fakeDoc("hidden");
    const send = rstest.fn();
    const stop = startPresencePings(doc, send);
    rstest.advanceTimersByTime(PRESENCE_EVERY_MS * 96); // a full day hidden
    expect(send).not.toHaveBeenCalled();
    stop();
  });

  it("pings when the tab comes back into view, and not when it leaves", () => {
    const { doc, show } = fakeDoc("hidden");
    const send = rstest.fn();
    const stop = startPresencePings(doc, send);
    show("visible");
    expect(send).toHaveBeenCalledTimes(1);
    show("hidden");
    expect(send).toHaveBeenCalledTimes(1);
    stop();
  });

  it("keeps pinging on the timer while the tab stays in view, so a new day is marked", () => {
    const { doc } = fakeDoc("visible");
    const send = rstest.fn();
    const stop = startPresencePings(doc, send);
    expect(send).not.toHaveBeenCalled(); // the mount is a page load, already counted
    rstest.advanceTimersByTime(PRESENCE_EVERY_MS * 2);
    expect(send).toHaveBeenCalledTimes(2);
    stop();
  });

  it("stops listening and ticking once stopped", () => {
    const { doc, show } = fakeDoc("visible");
    const send = rstest.fn();
    startPresencePings(doc, send)();
    show("visible");
    rstest.advanceTimersByTime(PRESENCE_EVERY_MS * 4);
    expect(send).not.toHaveBeenCalled();
  });
});
