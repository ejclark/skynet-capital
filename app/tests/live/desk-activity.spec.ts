import { fetchDeskActivity } from "../../src/live/desk";

/**
 * `fetchDeskActivity` (#4650): an older page and the server-side narrowing ride as query params on
 * the one `/api/desk/:id/activity` read. Only the URL is covered here — the narrowing itself is
 * `tests/server/desk-activity-filters.spec.ts`'s job.
 */

function stubFetch(): { calls: string[] } {
  const calls: string[] = [];
  globalThis.fetch = ((url: string) => {
    calls.push(url);
    return Promise.resolve(
      new Response(JSON.stringify({ available: true, activity: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
  }) as typeof globalThis.fetch;
  return { calls };
}

describe("fetchDeskActivity", () => {
  it("sends the cursor, the symbol and the playbook, encoded, and leaves out what is unset", async () => {
    const { calls } = stubFetch();
    // The newest, unnarrowed page stays the bare URL every other reader of the ledger asks for.
    await fetchDeskActivity("bot-sauron");
    await fetchDeskActivity("bot-sauron", {
      before: "2026-10-01T14:00:00.000Z",
      symbol: "NVDA",
      playbook: undefined,
    });
    await fetchDeskActivity("bot-sauron", { playbook: "NVDA-CALL-SPREAD" });
    expect(calls).toEqual([
      "/api/desk/bot-sauron/activity",
      "/api/desk/bot-sauron/activity?before=2026-10-01T14%3A00%3A00.000Z&symbol=NVDA",
      "/api/desk/bot-sauron/activity?playbook=NVDA-CALL-SPREAD",
    ]);
  });
});
