import {
  type AnthropicStreamEvent,
  type DoStreamFetch,
  streamAnthropicMessage,
  textDelta,
} from "../../src/companion/companion-anthropic-stream.js";

/** A fake streaming fetch whose body yields `chunks` (already-SSE-framed text), one enqueue per
 *  chunk — split across separate reads so the parser's buffering is genuinely exercised, not just
 *  handed one already-complete frame. */
function fakeStream(chunks: readonly string[], status = 200): DoStreamFetch {
  const encoder = new TextEncoder();
  return () =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      body: new ReadableStream<Uint8Array>({
        start(controller) {
          for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
          controller.close();
        },
      }),
      text: () => Promise.resolve(chunks.join("")),
    });
}

describe("streamAnthropicMessage", () => {
  it("decodes each SSE frame into an event, in order, even split across reads", async () => {
    const events: AnthropicStreamEvent[] = [];
    await streamAnthropicMessage(
      "https://api.anthropic.com/v1/messages",
      { "x-api-key": "k" },
      { model: "m" },
      (e) => events.push(e),
      fakeStream([
        'event: message_start\ndata: {"type":"message_start"}\n\n',
        'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hel',
        'lo"}}\n\n',
        'data: {"type":"message_stop"}\n\n',
      ]),
    );

    expect(events.map((e) => e.type)).toEqual([
      "message_start",
      "content_block_delta",
      "message_stop",
    ]);
    expect(textDelta(events[1] as AnthropicStreamEvent)).toBe("Hello");
  });

  it("throws on a non-2xx response and never calls onEvent", async () => {
    const events: AnthropicStreamEvent[] = [];
    await expect(
      streamAnthropicMessage(
        "https://api.anthropic.com/v1/messages",
        { "x-api-key": "bad" },
        {},
        (e) => events.push(e),
        () =>
          Promise.resolve({
            ok: false,
            status: 401,
            body: null,
            text: () => Promise.resolve('{"error":{"message":"invalid x-api-key"}}'),
          }),
      ),
    ).rejects.toThrow(/401/);
    expect(events).toEqual([]);
  });

  it("skips a malformed frame rather than throwing mid-stream", async () => {
    const events: AnthropicStreamEvent[] = [];
    await streamAnthropicMessage(
      "https://api.anthropic.com/v1/messages",
      {},
      {},
      (e) => events.push(e),
      fakeStream(["data: {not json}\n\n", 'data: {"type":"message_stop"}\n\n']),
    );
    expect(events).toEqual([{ type: "message_stop" }]);
  });
});

describe("textDelta", () => {
  it("is undefined for anything that isn't a text content_block_delta", () => {
    expect(textDelta({ type: "message_stop" })).toBeUndefined();
    expect(
      textDelta({
        type: "content_block_delta",
        delta: { type: "input_json_delta", partial_json: "{" },
      }),
    ).toBeUndefined();
  });
});
