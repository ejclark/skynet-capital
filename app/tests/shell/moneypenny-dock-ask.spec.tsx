import { act, fireEvent, screen } from "@testing-library/react";
import { FAST_TRACK_QUESTION, QUICK_QUESTIONS } from "../../src/live/landing-ask";
import { timing, useMoneypenny } from "../../src/live/moneypenny";
import { keyFor } from "../../src/live/moneypenny-storage";
import { AskBox } from "../../src/shell/landing-ask";
import { flush, inHistory, json, mount as mountDock, onboarding } from "./moneypenny-dock-harness";

/**
 * A question asked from the landing page's ask box (#7165). Eric, live on /app/: "it took 30
 * seconds for the text to render" — the box awaited the rail's onboarding read (no timeout)
 * before the question was sent, so a slow link showed an empty panel with his question still in
 * the box. Every case here holds that read open on purpose.
 *
 * The dock (#7487 slice 2): the landing page keeps only its quick questions (D6), and asking
 * opens nothing — the question waits in History while the dock's latest line says she is typing.
 */
const QUICK = QUICK_QUESTIONS.find((q) => q !== FAST_TRACK_QUESTION) ?? "";

describe("asking from outside the dock", () => {
  let realFetch: typeof globalThis.fetch;
  let answerOnboarding: (viewerId: string) => void;
  beforeEach(() => {
    realFetch = globalThis.fetch;
    timing.typingMs = 0;
    timing.opsMs = 0;
    timing.bindWaitMs = 5000;
    localStorage.clear();
    useMoneypenny.getState().reset();
    useMoneypenny.setState({ member: undefined, history: false });
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

  const mount = () => mountDock(<AskBox />);
  const userLines = () => useMoneypenny.getState().messages.filter((m) => m.role === "user");

  it("shows her typing line at once and keeps the question, opening nothing", () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: QUICK }));
    // no awaits: the onboarding read has not answered
    expect(screen.getByRole("button", { name: /^Moneypenny: typing ···/ })).toBeInTheDocument();
    expect(useMoneypenny.getState().pending).toBe(QUICK);
    expect(
      screen.queryByRole("region", { name: "Conversation with Moneypenny" }),
    ).not.toBeInTheDocument();
    // the question is already in the conversation, drawn as the member's own line
    act(() => useMoneypenny.getState().openHistory());
    expect(inHistory().getByText(QUICK)).toHaveClass("mp-user");
    expect(inHistory().getByText("Moneypenny · typing ···")).toBeInTheDocument();
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
    act(() => useMoneypenny.setState({ history: true }));
    expect(inHistory().getAllByText("what's moving today?")).toHaveLength(1);
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
    // a quick question tapped now is refused: the first question stays the one waiting
    fireEvent.click(screen.getByRole("button", { name: QUICK }));
    expect(useMoneypenny.getState().pending).toBe("first question");
    // the dock's own box waits too, and keeps what the member typed
    const box = screen.getByLabelText("Message Moneypenny");
    fireEvent.change(box, { target: { value: "second question" } });
    fireEvent.keyDown(box, { key: "Enter" });
    expect(box).toHaveValue("second question");
    expect(screen.queryByText("second question", { selector: ".mp-user" })).toBeNull();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });
});
