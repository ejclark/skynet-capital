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
  binaryType = "blob";
  readonly sent: string[] = [];
  closed = false;
  constructor(
    readonly url: string,
    private readonly authorized = FakeAlpacaSocket.nextAuthorized,
  ) {
    super();
    FakeAlpacaSocket.last = this;
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
