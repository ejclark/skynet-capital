import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { timing, useMoneypenny } from "../../src/live/moneypenny";
import { keyFor } from "../../src/live/moneypenny-storage";
import { AskBox } from "../../src/shell/landing-ask";
import { MoneypennyRail } from "../../src/shell/moneypenny-rail";
import { flush, json, onboarding } from "./moneypenny-rail-harness";

/**
 * A question asked from the landing page's ask box (#7165). Eric, live on /app/: "it took 30
 * seconds for the text to render" — the box awaited the rail's onboarding read (no timeout)
 * before the question was sent, so a slow link showed an empty panel with his question still in
 * the box. Every case here holds that read open on purpose.
 */
describe("asking from outside the rail", () => {
  let realFetch: typeof globalThis.fetch;
  let answerOnboarding: (viewerId: string) => void;
  beforeEach(() => {
    realFetch = globalThis.fetch;
    timing.typingMs = 0;
    timing.opsMs = 0;
    timing.bindWaitMs = 5000;
    localStorage.clear();
    useMoneypenny.getState().reset();
    useMoneypenny.setState({ member: undefined, open: false });
    // The onboarding read hangs until a case answers it; every other route is unwired (404),
    // so the live chat is off and she answers from her script.
    let release: (r: Response) => void = () => undefined;
    const held = new Promise<Response>((ok) => {
      release = ok;
    });
    answerOnboarding = (viewerId) => release(json({ ...onboarding(true), viewerId }));
    globalThis.fetch = ((url: string) =>
      url === "/api/onboarding"
        ? held
        : Promise.resolve(new Response("{}", { status: 404 }))) as typeof globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
    timing.bindWaitMs = 5000;
  });

  const mount = () =>
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AskBox />
        <MoneypennyRail />
      </QueryClientProvider>,
    );
  const userLines = () => useMoneypenny.getState().messages.filter((m) => m.role === "user");

  it("shows the question and her typing line at once, and clears the box", () => {
    mount();
    const box = screen.getByRole("textbox", { name: "What do you want to do today?" });
    fireEvent.change(box, { target: { value: "what's moving today?" } });
    fireEvent.click(screen.getByRole("button", { name: "Ask" }));
    // no awaits: the onboarding read has not answered
    expect(screen.getByText("what's moving today?")).toHaveClass("mp-user");
    expect(screen.getByText("Moneypenny · typing ···")).toBeInTheDocument();
    expect(box).toHaveValue("");
  });

  it("lands the question in the signed-in member's own thread, never anon's", async () => {
    mount();
    act(() => {
      useMoneypenny.getState().ask("what's moving today?");
    });
    await act(async () => answerOnboarding("member-1"));
    await flush();
    expect(useMoneypenny.getState().member).toBe("member-1");
    expect(userLines().map((m) => m.text)).toEqual(["what's moving today?"]);
    expect(localStorage.getItem(keyFor("member-1"))).toContain("what's moving today?");
    expect(localStorage.getItem(keyFor("anon"))).toBeNull();
    expect(screen.getAllByText("what's moving today?")).toHaveLength(1);
  });

  it("sends anyway when the read never answers, and carries it to the member when it does", async () => {
    timing.bindWaitMs = 20;
    mount();
    act(() => {
      useMoneypenny.getState().ask("what's moving today?");
    });
    await flush();
    await flush();
    // sent under no known member, her scripted answer after it
    expect(userLines().map((m) => m.text)).toEqual(["what's moving today?"]);
    expect(useMoneypenny.getState().messages.some((m) => m.role === "mp")).toBe(true);
    expect(useMoneypenny.getState().pending).toBeUndefined();

    await act(async () => answerOnboarding("member-1"));
    await flush();
    expect(useMoneypenny.getState().member).toBe("member-1");
    expect(userLines().map((m) => m.text)).toEqual(["what's moving today?"]);
    expect(localStorage.getItem(keyFor("member-1"))).toContain("what's moving today?");
    expect(localStorage.getItem(keyFor("anon"))).toBeNull();
  });

  it("refuses a second question while the first is waiting, and the box keeps its text", () => {
    mount();
    act(() => {
      useMoneypenny.getState().ask("first question");
    });
    const box = screen.getByRole("textbox", { name: "What do you want to do today?" });
    fireEvent.change(box, { target: { value: "second question" } });
    fireEvent.click(screen.getByRole("button", { name: "Ask" }));
    expect(box).toHaveValue("second question");
    expect(screen.queryByText("second question", { selector: ".mp-user" })).toBeNull();
    // the rail's own composer waits too
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });
});
