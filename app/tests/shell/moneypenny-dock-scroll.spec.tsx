import { act } from "@testing-library/react";
import { useMoneypenny } from "../../src/live/moneypenny";
import { mount } from "./moneypenny-dock-harness";

// #5182: in the rail, the chips came back when her stream ended — a render where no message is
// appended — and shortened the list from below, hiding her last line. In the dock (#7487 slice 2)
// her moves sit in the dock under History, never inside the conversation's list, so their return
// cannot cover her last line; the list follows every append to its end, and a member who scrolled
// up to read is left where they were when only the moves change. happy-dom has no layout, so the
// list's geometry is stubbed: a 500px conversation in a 300px window, its end at scrollTop 200.
// History opens after the mount: the dock closes it on its first location read, as on any page.
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

describe("MoneypennyDock — History stays at its end", () => {
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
    act(() => useMoneypenny.setState({ history: true }));
    const list = container.querySelector<HTMLElement>(".mp-list");
    if (!list) throw new Error("no message list");
    expect(container.querySelector(".mp-moves")).toBeNull();
    act(() => useMoneypenny.setState({ streaming: false }));
    const moves = container.querySelector(".mp-moves");
    expect(moves).not.toBeNull();
    expect(list.contains(moves)).toBe(false);
  });

  it("follows every append to the end of the list", () => {
    const { container } = mount();
    act(() => useMoneypenny.setState({ history: true }));
    const list = container.querySelector<HTMLElement>(".mp-list");
    if (!list) throw new Error("no message list");
    const g = geometry(list);
    g.top = 40;
    act(() =>
      useMoneypenny.setState((s) => ({
        streaming: false,
        messages: [...s.messages, { role: "mp", text: "Moneypenny · one more line." }],
      })),
    );
    expect(list.scrollTop).toBe(500);
  });

  it("leaves a member who scrolled up to read where they were when only the moves return", () => {
    const { container } = mount();
    act(() => useMoneypenny.setState({ history: true }));
    const list = container.querySelector<HTMLElement>(".mp-list");
    if (!list) throw new Error("no message list");
    const g = geometry(list);
    g.top = 40;
    act(() => useMoneypenny.setState({ streaming: false }));
    expect(container.querySelector(".mp-moves")).not.toBeNull();
    expect(list.scrollTop).toBe(40);
  });
});
