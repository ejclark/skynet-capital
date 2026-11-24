import {
  AlpacaTradeUpdatesStream,
  streamUrlFromBase,
} from "../../src/alpaca/trade-updates-stream.js";

describe("streamUrlFromBase", () => {
  it("derives the wss /stream URL from the paper base", () => {
    expect(streamUrlFromBase("https://paper-api.alpaca.markets")).toBe(
      "wss://paper-api.alpaca.markets/stream",
    );
  });

  it("tolerates a trailing /v2 on the base", () => {
    expect(streamUrlFromBase("https://paper-api.alpaca.markets/v2")).toBe(
      "wss://paper-api.alpaca.markets/stream",
    );
  });
});

// A socket that plays Alpaca's side of the handshake: every `listen` sent on an unauthorized
// connection is answered with another `authorization` frame — the reply that made the old
// always-`listen` handler ping-pong forever (2026-09-30 prod outage).
class FakeAlpacaSocket extends EventTarget {
  static last: FakeAlpacaSocket | undefined;
  static opened = 0;
  binaryType = "blob";
  readonly sent: string[] = [];
  closed = false;
  constructor(
    readonly url: string,
    private readonly authorized = FakeAlpacaSocket.nextAuthorized,
  ) {
    super();
    FakeAlpacaSocket.last = this;
    FakeAlpacaSocket.opened += 1;
  }
  static nextAuthorized = true;
  send(text: string): void {
    this.sent.push(text);
    if (this.sent.length > 50) throw new Error("runaway: over 50 frames sent");
    const { action } = JSON.parse(text) as { action: string };
    const status = this.authorized ? "authorized" : "unauthorized";
    if (action === "auth" || (action === "listen" && !this.authorized)) {
      this.reply({ stream: "authorization", data: { action, status } });
    }
  }
  close(): void {
    this.closed = true;
  }
  open(): void {
    this.dispatchEvent(new Event("open"));
  }
  /** The network drops it — not a close this side asked for. */
  drop(): void {
    this.dispatchEvent(new Event("close"));
  }
  reply(body: unknown): void {
    this.dispatchEvent(new MessageEvent("message", { data: JSON.stringify(body) }));
  }
}

describe("AlpacaTradeUpdatesStream handshake", () => {
  const realWebSocket = globalThis.WebSocket;
  beforeEach(() => {
    globalThis.WebSocket = FakeAlpacaSocket as unknown as typeof WebSocket;
  });
  afterEach(() => {
    globalThis.WebSocket = realWebSocket;
  });

  function startStream(authorized: boolean): { socket: FakeAlpacaSocket; statuses: string[] } {
    FakeAlpacaSocket.nextAuthorized = authorized;
    const statuses: string[] = [];
    new AlpacaTradeUpdatesStream({
      participantId: "day-trader",
      apiKey: "k",
      apiSecret: "s",
      baseUrl: "https://paper-api.alpaca.markets",
      onEvent: () => undefined,
      onStatus: (s) => statuses.push(s),
    }).start();
    const socket = FakeAlpacaSocket.last as FakeAlpacaSocket;
    socket.open();
    return { socket, statuses };
  }

  it("listens once after an authorized handshake", () => {
    const { socket, statuses } = startStream(true);
    expect(socket.sent.map((t) => JSON.parse(t).action)).toEqual(["auth", "listen"]);
    expect(statuses).toEqual(["day-trader: listening"]);
  });

  it("never re-sends listen when Alpaca repeats an authorized frame", () => {
    const { socket } = startStream(true);
    socket.reply({
      stream: "authorization",
      data: { action: "authenticate", status: "authorized" },
    });
    expect(socket.sent.filter((t) => JSON.parse(t).action === "listen")).toHaveLength(1);
  });

  it("rejected keys close the socket instead of ping-ponging listen", () => {
    const { socket, statuses } = startStream(false);
    expect(socket.sent.map((t) => JSON.parse(t).action)).toEqual(["auth"]);
    expect(socket.closed).toBe(true);
    expect(statuses).toEqual(["day-trader: unauthorized (unauthorized)"]);
  });
});

// #8251: the stream used to stay closed after any drop, so a fill in the gap was missed until the
// next deploy. These drive the reopen with fake timers, the way market-data-stream.spec.ts does.
describe("AlpacaTradeUpdatesStream reconnect", () => {
  const realWebSocket = globalThis.WebSocket;
  beforeEach(() => {
    rstest.useFakeTimers();
    rstest.setSystemTime(new Date("2026-11-24T14:30:00.000Z"));
    FakeAlpacaSocket.opened = 0;
    FakeAlpacaSocket.nextAuthorized = true;
    globalThis.WebSocket = FakeAlpacaSocket as unknown as typeof WebSocket;
  });
  afterEach(() => {
    rstest.useRealTimers();
    globalThis.WebSocket = realWebSocket;
  });

  function listeningStream() {
    const statuses: string[] = [];
    const resumes: string[] = [];
    const stream = new AlpacaTradeUpdatesStream({
      participantId: "day-trader",
      apiKey: "k",
      apiSecret: "s",
      baseUrl: "https://paper-api.alpaca.markets",
      onEvent: () => undefined,
      onStatus: (s) => statuses.push(s),
      onResume: (droppedAt) => resumes.push(droppedAt),
    });
    stream.start();
    (FakeAlpacaSocket.last as FakeAlpacaSocket).open();
    return { stream, statuses, resumes, socket: () => FakeAlpacaSocket.last as FakeAlpacaSocket };
  }

  it("reopens after a drop, listens once, and reports the drop to onResume", () => {
    const { statuses, resumes, socket } = listeningStream();
    expect(resumes).toEqual([]);

    socket().drop();
    expect(statuses).toContain("day-trader: reconnecting in 1s");
    expect(FakeAlpacaSocket.opened).toBe(1);

    rstest.advanceTimersByTime(1000);
    expect(FakeAlpacaSocket.opened).toBe(2);
    socket().open();

    expect(socket().sent.map((t) => JSON.parse(t).action)).toEqual(["auth", "listen"]);
    expect(resumes).toEqual(["2026-11-24T14:30:00.000Z"]);
  });

  it("backs off 1s, 2s, 4s … up to 60s, and an authorized answer resets it", () => {
    const { statuses, socket } = listeningStream();
    const waits: number[] = [];
    for (let i = 0; i < 8; i += 1) {
      socket().drop();
      const wait = Number(/reconnecting in (\d+)s/.exec(statuses.at(-1) ?? "")?.[1]);
      waits.push(wait);
      rstest.advanceTimersByTime(wait * 1000);
    }
    expect(waits).toEqual([1, 2, 4, 8, 16, 32, 60, 60]);

    socket().open(); // authorized → reset
    socket().drop();
    expect(statuses.at(-1)).toBe("day-trader: reconnecting in 1s");
  });

  it("keeps the FIRST drop's time across failed reopens, so the re-read covers the whole gap", () => {
    const { resumes, socket } = listeningStream();
    socket().drop();
    rstest.advanceTimersByTime(1000);
    socket().drop(); // the reopen fails before it signs in
    rstest.advanceTimersByTime(2000);
    socket().open();
    expect(resumes).toEqual(["2026-11-24T14:30:00.000Z"]);
  });

  it("an error on the socket reopens once, not twice, when its close follows", () => {
    const { statuses, socket } = listeningStream();
    socket().dispatchEvent(new Event("error"));
    socket().drop();
    expect(statuses.filter((s) => s.includes("reconnecting"))).toHaveLength(1);
    rstest.advanceTimersByTime(60_000);
    expect(FakeAlpacaSocket.opened).toBe(2);
  });

  it("a refused sign-in on a reopen stays closed", () => {
    const { statuses, socket } = listeningStream();
    socket().drop();
    FakeAlpacaSocket.nextAuthorized = false;
    rstest.advanceTimersByTime(1000);
    socket().open();
    expect(socket().closed).toBe(true);
    socket().drop(); // the refused socket's own close event
    rstest.advanceTimersByTime(120_000);
    expect(FakeAlpacaSocket.opened).toBe(2);
    expect(statuses.at(-1)).toBe("day-trader: closed");
  });

  it("stop() during the backoff cancels the reopen", () => {
    const { stream, socket } = listeningStream();
    socket().drop();
    stream.stop();
    rstest.advanceTimersByTime(120_000);
    expect(FakeAlpacaSocket.opened).toBe(1);
  });

  it("the stopped socket's own close never reopens it", () => {
    const { stream, socket } = listeningStream();
    const old = socket();
    stream.stop();
    expect(old.closed).toBe(true);
    old.drop();
    rstest.advanceTimersByTime(120_000);
    expect(FakeAlpacaSocket.opened).toBe(1);
  });
});
