import { InMemoryAlertDismissals } from "../../src/adapters/in-memory-alert-dismissals.js";

describe("InMemoryAlertDismissals", () => {
  it("loads empty for a consumer it has never seen", async () => {
    const store = new InMemoryAlertDismissals();
    expect(await store.loadDismissed("eric")).toEqual([]);
  });

  it("returns what a consumer dismissed", async () => {
    const store = new InMemoryAlertDismissals();
    await store.dismiss("eric", "fp-1");
    await store.dismiss("eric", "fp-2");
    expect([...(await store.loadDismissed("eric"))].sort()).toEqual(["fp-1", "fp-2"]);
  });

  it("collapses a repeat dismissal instead of erroring", async () => {
    const store = new InMemoryAlertDismissals();
    await store.dismiss("eric", "fp-1");
    await store.dismiss("eric", "fp-1");
    expect(await store.loadDismissed("eric")).toEqual(["fp-1"]);
  });

  it("scopes dismissals per consumer", async () => {
    const store = new InMemoryAlertDismissals();
    await store.dismiss("eric", "fp-1");
    expect(await store.loadDismissed("sauron")).toEqual([]);
  });

  it("hands back a copy — mutating it does not rewrite the store", async () => {
    const store = new InMemoryAlertDismissals();
    await store.dismiss("eric", "fp-1");
    const loaded = await store.loadDismissed("eric");
    (loaded as string[]).length = 0;
    expect(await store.loadDismissed("eric")).toEqual(["fp-1"]);
  });
});
