import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import type { EditionDate } from "../../src/live/edition";
import { timing, useMoneypenny } from "../../src/live/moneypenny";
import { keyFor, load } from "../../src/live/moneypenny-storage";
import { EventThread } from "../../src/shell/landing-ask";
import { MoneypennyRail } from "../../src/shell/moneypenny-rail";
import { flush, json, onboarding } from "./moneypenny-rail-harness";

/**
 * A side thread on its row (#7167 criterion 11). Eric, #7018 round 4: "the ability to create
 * threads; progressive disclosure. This enables side conversations to happen in context." Round 5
 * put the thread on the row it is about and asked that it collapse ("the thread body is noise to the
 * user when it's not the content of focus"), with dividers between threads. Each case asks about a
 * calendar event's row the way a member does, and reads the row and the rail the way they would.
 */

const event: EditionDate = {
  date: "2026-11-10",
  when: "Tue 10 Nov",
  what: "CoreWeave Q3 results",
  status: "confirmed",
};
const KEY = "event-2026-11-10-coreweave-q3-results";

const stream = (text: string) =>
  new Response(`event: delta\ndata: ${JSON.stringify({ text })}\n\nevent: done\ndata: {}\n\n`, {
    status: 200,
    headers: { "content-type": "text/event-stream" },
  });

describe("a side thread on its row", () => {
  let realFetch: typeof globalThis.fetch;
  let chats: { messages: { role: string; content: string }[] }[];
  beforeEach(() => {
    realFetch = globalThis.fetch;
    timing.typingMs = 0;
    timing.opsMs = 0;
    localStorage.clear();
    useMoneypenny.getState().reset();
    useMoneypenny.setState({ member: undefined, open: false });
    chats = [];
    let turn = 0;
    globalThis.fetch = ((url: string, init?: RequestInit) => {
      if (url === "/api/onboarding")
        return Promise.resolve(json({ ...onboarding(true), viewerId: "member-1" }));
      if (url === "/api/companion") return Promise.resolve(json({ enabled: true, disclosure: "" }));
      if (url === "/api/companion/chat") {
        chats.push(JSON.parse(String(init?.body)));
        turn++;
        return Promise.resolve(stream(`answer ${turn}`));
      }
      return Promise.resolve(new Response("{}", { status: 404 }));
    }) as typeof globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  const mount = () =>
    render(
      <QueryClientProvider client={new QueryClient()}>
        <EventThread event={event} />
        <MoneypennyRail />
      </QueryClientProvider>,
    );
  const askOnRow = async (text: string) => {
    fireEvent.change(screen.getByRole("textbox", { name: "Ask Moneypenny about this" }), {
      target: { value: text },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ask" }));
    await flush();
    await flush();
  };
  const row = () => screen.getByRole("region", { name: "Ask about this event" });
  const rail = () => screen.getByRole("complementary", { name: "Moneypenny" });

  it("opens the rail on the row's thread, named by the row, with the way back", async () => {
    mount();
    await askOnRow("what's the setup?");
    const lines = useMoneypenny.getState().messages.filter((m) => m.role !== "sys");
    expect(lines.map((m) => [m.role, m.thread])).toEqual([
      ["user", KEY],
      ["mp", KEY],
    ]);
    // the question names its row, so "this" has one referent
    expect(lines[0]?.text).toBe('About "CoreWeave Q3 results" (Tue 10 Nov): what\'s the setup?');
    expect(within(rail()).getByText("Moneypenny · answer 1")).toBeInTheDocument();
    expect(within(rail()).getByRole("link", { name: "CoreWeave Q3 results" })).toHaveAttribute(
      "href",
      `/app/#${KEY}`,
    );
    expect(within(rail()).getByRole("button", { name: "Main conversation" })).toBeEnabled();
  });

  it("keeps the thread out of the main conversation, behind one closed line", async () => {
    mount();
    await askOnRow("what's the setup?");
    fireEvent.click(within(rail()).getByRole("button", { name: "Main conversation" }));
    expect(within(rail()).queryByText("Moneypenny · answer 1")).not.toBeInTheDocument();
    const index = rail().querySelector("details.mp-threads");
    expect(index).not.toHaveAttribute("open");
    expect(within(rail()).getByText(/Your side threads/)).toHaveTextContent(
      "Your side threads · 1",
    );
    // its one line opens the thread again
    fireEvent.click(within(rail()).getByRole("button", { name: /CoreWeave Q3 results/ }));
    expect(within(rail()).getByText("Moneypenny · answer 1")).toBeInTheDocument();
  });

  it("sends her only the thread's own lines, never the main conversation's", async () => {
    mount();
    await act(async () => {
      await useMoneypenny.getState().openRail();
      await useMoneypenny.getState().send("what's moving today?");
    });
    await askOnRow("what's the setup?");
    const last = chats.at(-1)?.messages ?? [];
    expect(last.map((m) => m.content)).toEqual([
      'About "CoreWeave Q3 results" (Tue 10 Nov): what\'s the setup?',
    ]);
  });

  it("shows the thread on its row, collapsed, with a way to continue it in the chat", async () => {
    mount();
    await askOnRow("what's the setup?");
    act(() => useMoneypenny.getState().closeRail());
    const thread = within(row()).getByText(/Your thread with Moneypenny/);
    expect(thread).toHaveTextContent("Your thread with Moneypenny · 2 messages");
    expect(row().querySelector("details.row-thread")).not.toHaveAttribute("open");
    expect(within(row()).getByText("Moneypenny · answer 1")).toBeInTheDocument();
    act(() => useMoneypenny.getState().closeThread());
    fireEvent.click(within(row()).getByRole("button", { name: "Continue in the chat" }));
    expect(useMoneypenny.getState().open).toBe(true);
    expect(useMoneypenny.getState().thread?.key).toBe(KEY);
  });

  it("answers a reply in the rail inside the same thread", async () => {
    mount();
    await askOnRow("what's the setup?");
    fireEvent.change(within(rail()).getByLabelText("Message Moneypenny"), {
      target: { value: "and the options?" },
    });
    fireEvent.click(within(rail()).getByRole("button", { name: "Send" }));
    await flush();
    const tagged = useMoneypenny.getState().messages.filter((m) => m.thread === KEY);
    expect(tagged.map((m) => m.text)).toContain("and the options?");
    expect(tagged.map((m) => m.text)).toContain("Moneypenny · answer 2");
  });

  it("keeps the thread, by name, in the member's own saved conversation", async () => {
    mount();
    await askOnRow("what's the setup?");
    const saved = JSON.parse(localStorage.getItem(keyFor("member-1")) ?? "{}");
    expect(saved.threads).toEqual([{ key: KEY, title: "CoreWeave Q3 results", path: `/#${KEY}` }]);
  });

  it("shows nothing on a row nobody has asked about", () => {
    mount();
    expect(within(row()).queryByText(/Your thread with Moneypenny/)).not.toBeInTheDocument();
  });

  it("keeps the main conversation's beats there: the celebration, and a filing it waits on", async () => {
    mount();
    // Bound to the member, the main conversation is waiting on the details of a filing.
    await act(() => useMoneypenny.getState().openRail());
    act(() => useMoneypenny.setState({ flow: "fb2" }));
    await askOnRow("what's the setup?");
    const sys = useMoneypenny.getState().messages.filter((m) => m.role === "sys");
    expect(sys.map((m) => m.thread)).toEqual([undefined]);
    // the row's question went to her, not into the filing, and the filing still waits
    expect(chats).toHaveLength(1);
    expect(useMoneypenny.getState().flow).toBe("fb2");
  });

  it("opens ✦ on the main conversation, with her intro there, never in a row's thread", async () => {
    mount();
    await askOnRow("what's the setup?");
    act(() => useMoneypenny.getState().closeRail());
    await act(async () => useMoneypenny.getState().toggleRail());
    await flush();
    expect(useMoneypenny.getState().thread).toBeUndefined();
    const intro = useMoneypenny.getState().messages.filter((m) => m.role === "mp" && !m.thread);
    expect(intro.length).toBeGreaterThan(0);
    // the row's question and her answer, untouched
    expect(useMoneypenny.getState().messages.filter((m) => m.thread === KEY)).toHaveLength(2);
  });

  it("offers a fresh start on the main conversation only, since it forgets every thread", async () => {
    mount();
    await askOnRow("what's the setup?");
    expect(within(rail()).getByRole("button", { name: "New conversation" })).toBeDisabled();
    fireEvent.click(within(rail()).getByRole("button", { name: "Main conversation" }));
    expect(within(rail()).getByRole("button", { name: "New conversation" })).toBeEnabled();
  });

  /** A page reload: a fresh store (the module re-runs), the member's saved blob still on disk. */
  const reload = (view: ReturnType<typeof render>) => {
    view.unmount();
    act(() => useMoneypenny.setState(useMoneypenny.getInitialState(), true));
    return mount();
  };

  it("shows the saved thread on its row after a reload, before the chat is opened (#7308)", async () => {
    const before = mount();
    await askOnRow("what's the setup?");
    reload(before);
    await flush();
    expect(useMoneypenny.getState().open).toBe(false);
    expect(within(row()).getByText(/Your thread with Moneypenny/)).toHaveTextContent(
      "Your thread with Moneypenny · 2 messages",
    );
  });

  it("asks again on a reloaded row without doubling the lines it loaded (#7308)", async () => {
    const before = mount();
    await askOnRow("what's the setup?");
    reload(before);
    await flush();
    await askOnRow("and the options?");
    const tagged = useMoneypenny.getState().messages.filter((m) => m.thread === KEY);
    expect(tagged.map((m) => m.text)).toEqual([
      'About "CoreWeave Q3 results" (Tue 10 Nov): what\'s the setup?',
      "Moneypenny · answer 1",
      'About "CoreWeave Q3 results" (Tue 10 Nov): and the options?',
      "Moneypenny · answer 2",
    ]);
  });

  it("keeps the saved thread when the page-load read fails, binding no one (#7308)", async () => {
    const before = mount();
    await askOnRow("what's the setup?");
    const saved = localStorage.getItem(keyFor("member-1"));
    const working = globalThis.fetch;
    globalThis.fetch = ((url: string, init?: RequestInit) =>
      url === "/api/onboarding"
        ? Promise.resolve(new Response("{}", { status: 500 }))
        : working(url, init)) as typeof globalThis.fetch;
    reload(before);
    await flush();
    expect(useMoneypenny.getState().member).toBeUndefined();
    expect(localStorage.getItem(keyFor("member-1"))).toBe(saved);
  });

  it("drops a saved thread it cannot link to, keeping the good ones", () => {
    const good = { key: KEY, title: "CoreWeave Q3 results", path: `/#${KEY}` };
    localStorage.setItem(
      keyFor("member-2"),
      JSON.stringify({ messages: [], threads: [{}, good, { key: "x", title: "y" }] }),
    );
    expect(load("member-2").threads).toEqual([good]);
  });
});
