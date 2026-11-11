import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { timing, useMoneypenny } from "../../src/live/moneypenny";
import { keyFor } from "../../src/live/moneypenny-storage";
import { codec, SCREENSHOT_LIMIT_LINE } from "../../src/live/mp-screenshots";
import { flush, json, mount } from "./moneypenny-rail-harness";

// #6007 slice 3 — attaching a screenshot in Moneypenny's chat. The real store and composer run;
// only fetch (per route) and the browser's image codec are stubbed.
const ID = "ab".repeat(16);
const PIC = "data:image/png;base64,QUJD";

describe("MoneypennyRail — screenshots", () => {
  let realFetch: typeof globalThis.fetch;
  const realEncode = codec.encode;
  let sent: { url: string; body: unknown }[];
  let enabled: boolean;
  let uploadStatus: number;
  let chatFrames: string;

  beforeEach(() => {
    realFetch = globalThis.fetch;
    timing.typingMs = 0;
    timing.opsMs = 0;
    localStorage.clear();
    useMoneypenny.getState().reset();
    sent = [];
    enabled = true;
    uploadStatus = 200;
    chatFrames =
      'event: delta\ndata: {"text":"I can see the position."}\n\nevent: done\ndata: {}\n\n';
    codec.encode = () => Promise.resolve(PIC);
    globalThis.fetch = ((url: string, init?: RequestInit) => {
      sent.push({ url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
      if (url === "/api/companion") return Promise.resolve(json({ enabled, disclosure: "" }));
      if (url === "/api/companion/screenshots")
        return Promise.resolve(
          json(uploadStatus === 200 ? { ok: true, id: ID } : { ok: false }, uploadStatus),
        );
      if (url === "/api/companion/chat")
        return Promise.resolve(
          new Response(chatFrames, {
            status: 200,
            headers: { "content-type": "text/event-stream" },
          }),
        );
      return Promise.resolve(new Response("{}", { status: 404 }));
    }) as typeof globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
    codec.encode = realEncode;
  });

  const picker = () => document.querySelector<HTMLInputElement>('input[type="file"]');
  const pick = async (...files: File[]) => {
    await act(() => {
      fireEvent.change(picker() as HTMLInputElement, { target: { files } });
    });
    await flush();
  };
  const png = (name = "shot.png") => new File(["x"], name, { type: "image/png" });
  const type = (text: string) =>
    fireEvent.change(screen.getByLabelText("Message Moneypenny"), { target: { value: text } });
  const openRail = async () => {
    mount();
    await act(() => useMoneypenny.getState().openRail());
    await flush();
  };
  const sendIt = async () => {
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await flush();
  };
  const chatBody = () =>
    sent.find((c) => c.url === "/api/companion/chat")?.body as {
      messages: { role: string; content: string; screenshots?: string[] }[];
    };

  it("offers the attach control only when the live chat is on (criterion 6)", async () => {
    enabled = false;
    await openRail();
    expect(screen.queryByRole("button", { name: "Attach screenshot" })).not.toBeInTheDocument();
    expect(picker()).toBeNull();
  });

  it("shows a thumbnail with a remove control before anything is sent (criterion 1)", async () => {
    await openRail();
    expect(screen.getByRole("button", { name: "Attach screenshot" })).toBeInTheDocument();
    await pick(png());
    expect(screen.getByAltText("Screenshot you attached")).toHaveAttribute("src", PIC);
    expect(sent.some((c) => c.url === "/api/companion/screenshots")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Remove screenshot" }));
    expect(screen.queryByAltText("Screenshot you attached")).not.toBeInTheDocument();
  });

  it("holds at most three, and says so (criterion 1)", async () => {
    await openRail();
    await pick(png("a.png"), png("b.png"), png("c.png"), png("d.png"));
    expect(screen.getAllByAltText("Screenshot you attached")).toHaveLength(3);
    expect(screen.getByRole("status")).toHaveTextContent("up to 3 screenshots");
    expect(screen.getByRole("button", { name: "Attach screenshot" })).toBeDisabled();
  });

  it("refuses a file that is not a usable image in one line and keeps the typed text (criterion 3)", async () => {
    await openRail();
    type("here is the position");
    codec.encode = () => Promise.resolve(undefined);
    await pick(png("big.png"));
    expect(screen.getByRole("status")).toHaveTextContent(SCREENSHOT_LIMIT_LINE);
    expect(screen.queryByAltText("Screenshot you attached")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Message Moneypenny")).toHaveValue("here is the position");
  });

  it("uploads at send, then sends the turn with ids only — never bytes (criteria 4, 5)", async () => {
    await openRail();
    await pick(png());
    type("what is this P/L?");
    await sendIt();
    const urls = sent.map((c) => c.url);
    expect(urls.indexOf("/api/companion/screenshots")).toBeGreaterThan(-1);
    expect(urls.indexOf("/api/companion/screenshots")).toBeLessThan(
      urls.indexOf("/api/companion/chat"),
    );
    expect(chatBody().messages.at(-1)).toEqual({
      role: "user",
      content: "what is this P/L?",
      screenshots: [ID],
    });
    expect(JSON.stringify(chatBody())).not.toContain("base64");
    // the box is clear, and the saved conversation holds the id, not the picture
    expect(screen.getByLabelText("Message Moneypenny")).toHaveValue("");
    expect(screen.queryByRole("list", { name: "Screenshots to send" })).not.toBeInTheDocument();
    const saved = localStorage.getItem(keyFor(useMoneypenny.getState().member ?? "anon")) ?? "";
    expect(saved).toContain(ID);
    expect(saved).not.toContain("base64");
    expect(screen.getByAltText("Screenshot you attached")).toHaveAttribute(
      "src",
      `/api/companion/screenshots/${ID}`,
    );
  });

  it("still sends the words when the upload fails, and says the picture did not go (criterion 19)", async () => {
    uploadStatus = 507;
    await openRail();
    await pick(png());
    type("see this?");
    await sendIt();
    expect(chatBody().messages.at(-1)).toEqual({ role: "user", content: "see this?" });
    expect(screen.getByRole("status")).toHaveTextContent("Couldn't keep that screenshot");
  });

  it("takes a pasted image, and lets plain text paste as it always did (criterion 1)", async () => {
    await openRail();
    const box = screen.getByLabelText("Message Moneypenny");
    fireEvent.paste(box, { clipboardData: { files: [] } });
    expect(screen.queryByAltText("Screenshot you attached")).not.toBeInTheDocument();
    await act(() => {
      fireEvent.paste(box, { clipboardData: { files: [png("pasted.png")] } });
    });
    await flush();
    expect(screen.getAllByAltText("Screenshot you attached")).toHaveLength(1);
  });

  it("takes a dropped image (criterion 1)", async () => {
    await openRail();
    await act(() => {
      fireEvent.drop(screen.getByLabelText("Message Moneypenny"), {
        dataTransfer: { files: [png("dropped.png")] },
      });
    });
    await flush();
    expect(screen.getAllByAltText("Screenshot you attached")).toHaveLength(1);
  });

  it("shows the words, not a broken image, for a screenshot the store removed (criterion 20)", async () => {
    await openRail();
    act(() => {
      useMoneypenny.setState({
        messages: [{ role: "user", text: "look", at: Date.now(), screenshots: [ID, "../evil"] }],
      });
    });
    const img = screen.getByAltText("Screenshot you attached");
    expect(screen.getAllByAltText("Screenshot you attached")).toHaveLength(1); // the bad id is skipped
    fireEvent.error(img);
    await waitFor(() => expect(screen.getByText("Screenshot no longer kept")).toBeInTheDocument());
    expect(screen.queryByAltText("Screenshot you attached")).not.toBeInTheDocument();
  });

  it("tells the member screenshots stay inside the app when a filing is drafted (criterion 10)", async () => {
    chatFrames = [
      `event: handoff\ndata: ${JSON.stringify({ kind: "bug", title: "P/L is off", details: "It shows -$5." })}\n\n`,
      'event: delta\ndata: {"text":"drafted it."}\n\n',
      "event: done\ndata: {}\n\n",
    ].join("");
    await openRail();
    await pick(png());
    type("the P/L here looks wrong");
    await sendIt();
    expect(await screen.findByText(/Screenshots stay inside the app/)).toBeInTheDocument();
  });

  it("says nothing about screenshots in a filing drafted from a conversation with none", async () => {
    chatFrames = [
      `event: handoff\ndata: ${JSON.stringify({ kind: "bug", title: "P/L is off", details: "x" })}\n\n`,
      "event: done\ndata: {}\n\n",
    ].join("");
    await openRail();
    type("the P/L here looks wrong");
    await sendIt();
    await screen.findByText(/P\/L is off/);
    expect(screen.queryByText(/Screenshots stay inside the app/)).not.toBeInTheDocument();
  });
});
