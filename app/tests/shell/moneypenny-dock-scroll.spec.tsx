import { act } from "@testing-library/react";
import { useMoneypenny } from "../../src/live/moneypenny";
import { mount } from "./moneypenny-dock-harness";

// WHERE THE LIST SITS. Eric, 2026-11-13: "i have to scroll up through the history to read the
// beginning of the response most all of the time." So a new reply of hers anchors its FIRST line at
// the top of the pane, and her own line or typing beat goes to the end so the member sees what they
// sent. #5182 still holds: her moves sit outside the list, and their return never moves it. happy-dom
// has no layout, so the geometry is stubbed: a 500px conversation in a 300px pane.
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

describe("MoneypennyDock — the pane opens her answer at its start", () => {
  beforeEach(() => {
    localStorage.clear();
    useMoneypenny.getState().reset();
    useMoneypenny.setState({
      flow: "idle",
      streaming: true,
      messages: [{ role: "mp", text: 'Moneypenny · here\'s the draft — reply "send" to file it.' }],
    });
  });

  it("draws the returning moves outside the conversation's list, so her last line stays clear", () => {
    const { container } = mount();
    act(() => useMoneypenny.setState({ expanded: true }));
    const list = container.querySelector<HTMLElement>(".mp-list");
    if (!list) throw new Error("no message list");
    expect(container.querySelector(".mp-moves")).toBeNull();
    act(() => useMoneypenny.setState({ streaming: false }));
    const moves = container.querySelector(".mp-moves");
    expect(moves).not.toBeNull();
    expect(list.contains(moves)).toBe(false);
  });

  it("anchors at the reply's top as measured, and stays there while it streams", () => {
    const { container } = mount();
    const list = container.querySelector<HTMLElement>(".mp-list");
    if (!list) throw new Error("no message list");
    const g = geometry(list);
    // every entry reports 180px down: the newest one is the one the anchor reads
    const proto = Object.getPrototypeOf(list) as object;
    const original = Object.getOwnPropertyDescriptor(proto, "offsetTop");
    Object.defineProperty(proto, "offsetTop", { configurable: true, get: () => 180 });
    try {
      act(() =>
        useMoneypenny.setState((s) => ({
          streaming: true,
          messages: [...s.messages, { role: "mp", text: "Moneypenny · line one" }],
        })),
      );
      expect(list.scrollTop).toBe(172);
      // the stream grows the same reply: the pane holds its start
      act(() =>
        useMoneypenny.setState((s) => ({
          messages: [
            ...s.messages.slice(0, -1),
            { role: "mp", text: "Moneypenny · line one\nline two\nline three" },
          ],
        })),
      );
      expect(g.top).toBe(172);
    } finally {
      if (original) Object.defineProperty(proto, "offsetTop", original);
      else Reflect.deleteProperty(proto, "offsetTop");
    }
  });

  it("opens a page on the start of her latest reply, not on the oldest line", () => {
    const proto = HTMLElement.prototype as object;
    const original = Object.getOwnPropertyDescriptor(proto, "offsetTop");
    Object.defineProperty(proto, "offsetTop", { configurable: true, get: () => 180 });
    try {
      const { container } = mount();
      const list = container.querySelector<HTMLElement>(".mp-list");
      if (!list) throw new Error("no message list");
      expect(list.scrollTop).toBe(172);
    } finally {
      if (original) Object.defineProperty(proto, "offsetTop", original);
      else Reflect.deleteProperty(proto, "offsetTop");
    }
  });

  it("re-anchors on the start of her latest reply when the pane changes size", () => {
    const { container } = mount();
    const list = container.querySelector<HTMLElement>(".mp-list");
    if (!list) throw new Error("no message list");
    const g = geometry(list);
    g.top = 0;
    const proto = HTMLElement.prototype as object;
    const original = Object.getOwnPropertyDescriptor(proto, "offsetTop");
    Object.defineProperty(proto, "offsetTop", { configurable: true, get: () => 180 });
    try {
      // set directly: toggleExpanded also wakes the store, which re-binds this stub conversation
      act(() => useMoneypenny.setState({ expanded: !useMoneypenny.getState().expanded }));
      expect(list.scrollTop).toBe(172);
      g.top = 0;
      act(() => useMoneypenny.setState({ expanded: !useMoneypenny.getState().expanded }));
      expect(list.scrollTop).toBe(172);
    } finally {
      if (original) Object.defineProperty(proto, "offsetTop", original);
      else Reflect.deleteProperty(proto, "offsetTop");
    }
  });

  it("shows the member's own line at the end, so they see what they sent", () => {
    const { container } = mount();
    const list = container.querySelector<HTMLElement>(".mp-list");
    if (!list) throw new Error("no message list");
    const g = geometry(list);
    g.top = 40;
    act(() => useMoneypenny.setState({ pending: "what's moving today?" }));
    expect(list.scrollTop).toBe(500);
  });

  it("leaves a member who scrolled up to read where they were when only the moves return", () => {
    const { container } = mount();
    act(() => useMoneypenny.setState({ expanded: true }));
    const list = container.querySelector<HTMLElement>(".mp-list");
    if (!list) throw new Error("no message list");
    const g = geometry(list);
    g.top = 40;
    act(() => useMoneypenny.setState({ streaming: false }));
    expect(container.querySelector(".mp-moves")).not.toBeNull();
    expect(list.scrollTop).toBe(40);
  });
});
