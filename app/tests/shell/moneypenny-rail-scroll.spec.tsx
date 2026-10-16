import { act, fireEvent } from "@testing-library/react";
import { useMoneypenny } from "../../src/live/moneypenny";
import { mount } from "./moneypenny-rail-harness";

// #5182: the chips come back when her stream ends — a render where no message is appended — and
// shorten the list from below, hiding her last line (a draft's `reply "send"` line, 37px at 390
// and 1280). jsdom has no layout, so the list's geometry is stubbed: a 500px thread in a 300px
// window, its end at scrollTop 200.
function geometry(el: HTMLElement): { top: number } {
  const g = { top: 0 };
  Object.defineProperty(el, "scrollHeight", { configurable: true, get: () => 500 });
  Object.defineProperty(el, "clientHeight", { configurable: true, get: () => 300 });
  Object.defineProperty(el, "scrollTop", {
    configurable: true,
    get: () => g.top,
    set: (v: number) => {
      g.top = v;
    },
  });
  return g;
}

describe("MoneypennyRail — the thread stays at its end when the chips return", () => {
  beforeEach(() => {
    localStorage.clear();
    useMoneypenny.getState().reset();
    useMoneypenny.setState({
      open: true,
      flow: "idle",
      streaming: true,
      messages: [{ role: "mp", text: 'Moneypenny · here\'s the draft — reply "send" to file it.' }],
    });
  });

  it("re-pins to the end when the stream ends and the chips come back", () => {
    const { container } = mount();
    const list = container.querySelector<HTMLElement>(".mp-list");
    if (!list) throw new Error("no message list");
    const g = geometry(list);
    g.top = 200;
    fireEvent.scroll(list);
    g.top = 163; // the chips' row is what the browser leaves above the end
    act(() => useMoneypenny.setState({ streaming: false }));
    expect(container.querySelector(".mp-chips")).not.toBeNull();
    expect(list.scrollTop).toBe(500);
  });

  it("leaves a member who scrolled up to read where they were", () => {
    const { container } = mount();
    const list = container.querySelector<HTMLElement>(".mp-list");
    if (!list) throw new Error("no message list");
    const g = geometry(list);
    g.top = 40;
    fireEvent.scroll(list);
    act(() => useMoneypenny.setState({ streaming: false }));
    expect(container.querySelector(".mp-chips")).not.toBeNull();
    expect(list.scrollTop).toBe(40);
  });
});
