import type { ServerResponse } from "node:http";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import {
  handleOptionPost,
  OPTION_CODES,
  optionPreviewFromForm,
} from "../../src/server/option-order-review.js";
import type { TradeRouteDeps } from "../../src/server/trade-ticket-route.js";

const ann: ParticipantSnapshot = {
  id: "ann",
  displayName: "Ann",
  kind: "human",
  cash: 100_000,
  equity: 100_000,
  positions: [{ symbol: "MSFT260918P00420000", quantity: -2, avgPrice: 10.7, marketValue: 2_140 }],
  activity: [],
};

const deps = (over: Partial<TradeRouteDeps> = {}): TradeRouteDeps => ({
  snapshotFor: () => ann,
  requesterId: "ann",
  tradingEnabled: true,
  nav: { active: "trade", canAdd: false, authed: true },
  document: (_title: string, body: string) => body,
  ...over,
});

const capture = () => {
  const sent = { status: 0, body: "", location: "" };
  const res = {
    writeHead(status: number, headers?: Record<string, string>) {
      sent.status = status;
      sent.location = headers?.location ?? "";
    },
    end(body?: string) {
      sent.body = body ?? "";
    },
  } as unknown as ServerResponse;
  return { sent, res };
};

const form = (fields: Record<string, string>): URLSearchParams => new URLSearchParams(fields);

const openForm = () =>
  form({
    play: "302",
    symbol: "MSFT",
    contracts: "1",
    strike: "430",
    exp: "2026-09-18",
    limit: "8",
  });

/** A long-call OPEN preview against `ann` — used by the handleOptionPost specs below, which
 * exercise the review/execute step rather than the preview step itself. */
async function openReview(): Promise<Parameters<typeof handleOptionPost>[4]> {
  const reviewed = await optionPreviewFromForm(openForm(), ann, deps());
  if (!reviewed) throw new Error("expected an option preview for a supported OPEN form");
  return reviewed;
}

describe("OPTION_CODES", () => {
  it("names exactly the four option plays the ticket can OPEN — never an equity code", () => {
    expect([...OPTION_CODES].sort()).toEqual(["201", "202", "301", "302"]);
    expect(OPTION_CODES.has("101")).toBe(false);
  });
});

describe("optionPreviewFromForm", () => {
  it("is not option-shaped for a plain equity play — the share desk handles it instead", async () => {
    const reviewed = await optionPreviewFromForm(
      form({ play: "101", symbol: "AAPL" }),
      ann,
      deps(),
    );
    expect(reviewed).toBeUndefined();
  });

  it("previews a CLOSE from an OCC symbol regardless of any play code on the form", async () => {
    const reviewed = await optionPreviewFromForm(
      form({ close: "MSFT260918P00420000", contracts: "1" }),
      ann,
      deps(),
    );
    expect(reviewed?.request.kind).toBe("close");
    expect(reviewed?.request).toMatchObject({ occSymbol: "MSFT260918P00420000", contracts: 1 });
  });

  it("previews an OPEN from the posted play/strike/contracts — payable from cash", async () => {
    const reviewed = await optionPreviewFromForm(openForm(), ann, deps());
    expect(reviewed?.request).toMatchObject({
      kind: "open",
      code: "302",
      underlying: "MSFT",
      contracts: 1,
      strike: 430,
    });
    expect(reviewed?.preview.ok).toBe(true);
  });
});

describe("handleOptionPost", () => {
  it("renders the review screen and sends nothing on the first (unconfirmed) post", async () => {
    const { sent, res } = capture();
    await handleOptionPost(res, form({}), ann, deps(), await openReview());
    expect(sent.status).toBe(200);
    expect(sent.body).toContain("Review order");
  });

  it("executes and redirects once confirm=1 rides an OK preview", async () => {
    const { sent, res } = capture();
    await handleOptionPost(
      res,
      form({ confirm: "1" }),
      ann,
      deps({
        submitOptionTrade: () =>
          Promise.resolve({ ok: true as const, orderId: "o1", status: "accepted", symbol: "MSFT" }),
      }),
      await openReview(),
    );
    expect(sent.status).toBe(303);
    expect(sent.location).toContain("/u/ann");
    expect(sent.location).toContain("n=submitted");
  });

  it("refuses with 503 rather than pretending to submit when no execution path is wired up", async () => {
    const { sent, res } = capture();
    await handleOptionPost(res, form({ confirm: "1" }), ann, deps(), await openReview());
    expect(sent.status).toBe(503);
    expect(sent.body).toContain("No options execution path");
  });

  it("shows the service's refusal on fresh numbers rather than executing", async () => {
    const { sent, res } = capture();
    await handleOptionPost(
      res,
      form({ confirm: "1" }),
      ann,
      deps({
        submitOptionTrade: () =>
          Promise.resolve({ ok: false as const, refusals: ["Market's closed."] }),
      }),
      await openReview(),
    );
    expect(sent.status).toBe(200);
    expect(sent.body).toContain("Market's closed.");
  });
});
