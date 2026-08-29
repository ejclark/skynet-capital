import { AlpacaApiError } from "../../src/alpaca/alpaca-api-error.js";
import type { Participant } from "../../src/participants/participant.js";
import { readReview, submitAndAudit } from "../../src/server/desk-gate.js";

// The shared desk machinery's refusal strings are member-facing copy. These specs pin the
// sanitization contract (#788 treatment): a raw exception's text — which can carry internals
// like hostnames or proxy banners — is never relayed; the one exception is Alpaca's own
// rejection reason, the part that is genuinely the member's to act on.

const participant: Participant = {
  id: "ann",
  displayName: "Ann",
  kind: "human",
  credentials: { apiKey: "k", apiSecret: "s", baseUrl: "https://paper" },
};

describe("readReview — the live account re-read wrapper", () => {
  it("returns the preview when the read succeeds", async () => {
    expect(await readReview(() => Promise.resolve({ cash: 5000 }))).toEqual({
      preview: { cash: 5000 },
    });
  });

  it("never relays the exception's text — a fixed sentence, whatever was thrown", async () => {
    const result = await readReview(() =>
      Promise.reject(new Error("getaddrinfo ENOTFOUND paper-api.internal.corp")),
    );
    expect(result).toEqual({
      refusals: ["Couldn't read the account to check this order. Try again shortly."],
    });
  });
});

describe("submitAndAudit — what a member sees when the broker throws", () => {
  it("relays Alpaca's own rejection reason — that part is the member's to act on", async () => {
    const result = await submitAndAudit(
      () =>
        Promise.reject(
          new AlpacaApiError(403, { code: 40310000, message: "insufficient buying power" }),
        ),
      participant,
      {},
    );
    expect(result).toEqual({
      ok: false,
      refusals: ["The broker rejected the order: insufficient buying power"],
    });
  });

  it("keeps a broker rejection with no usable reason to a fixed sentence", async () => {
    const result = await submitAndAudit(
      () => Promise.reject(new AlpacaApiError(502, "<html>bad gateway at edge-7</html>")),
      participant,
      {},
    );
    expect(result).toEqual({ ok: false, refusals: ["The broker rejected the order."] });
  });

  it("never relays a transport exception's text to the member", async () => {
    const result = await submitAndAudit(
      () => Promise.reject(new Error("connect ECONNREFUSED proxy.internal.corp:8080")),
      participant,
      {},
    );
    expect(result).toEqual({
      ok: false,
      refusals: ["Couldn't reach the broker to place this order. Try again shortly."],
    });
  });

  it("never audits a refused submit", async () => {
    const audited: unknown[] = [];
    await submitAndAudit(() => Promise.reject(new Error("down")), participant, {
      recordAudit: (entry) => Promise.resolve(void audited.push(entry)),
    });
    expect(audited).toEqual([]);
  });
});
