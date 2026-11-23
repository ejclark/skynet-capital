import { describe, expect, it } from "@rstest/core";
import {
  actionsOf,
  afterMisses,
  describeAction,
  expectHolds,
  performAct,
} from "../../scripts/crawl/steps.mjs";

// The journey file's `act` list and `after` entries (#8005 slice 3), read by both the acceptance
// spec and the crawl through scripts/crawl/steps.mjs. A fake page records what each action did, so
// the order, the aim and the failure wording are pinned without a browser.

type Call = string;

/** A page whose locators log every call; `missing` names locators that never become visible. */
function fakePage(missing: readonly string[] = []) {
  const calls: Call[] = [];
  const locator = (label: string) => ({
    first: () => ({
      click: () => {
        if (missing.includes(label)) return Promise.reject(new Error("timeout"));
        calls.push(`click ${label}`);
        return Promise.resolve();
      },
      fill: (value: string) => {
        calls.push(`fill ${label} ${value}`);
        return Promise.resolve();
      },
      press: (key: string) => {
        calls.push(`press ${label} ${key}`);
        return Promise.resolve();
      },
      waitFor: () =>
        missing.includes(label) ? Promise.reject(new Error("timeout")) : Promise.resolve(),
      getAttribute: () => Promise.resolve(null),
    }),
  });
  const page = {
    getByRole: (role: string, opts: { name?: string }) => locator(`${role}:${opts.name ?? ""}`),
    getByText: (text: string) => locator(`text:${text}`),
    getByTestId: (id: string) => locator(`testid:${id}`),
    locator: () => page,
    waitForLoadState: async () => undefined,
    url: () => "http://x/app/leaderboard?by=equity",
  };
  return { page, calls };
}

describe("a step's act", () => {
  it("reads one action or a list, so the original shape still works", () => {
    const click = { click: { role: "link", name: "Profile" } };
    expect(actionsOf(undefined)).toEqual([]);
    expect(actionsOf(click)).toEqual([click]);
    expect(actionsOf([click, click])).toHaveLength(2);
  });

  it("runs a conversation in order: type, send, wait for her line, follow her link", async () => {
    const { page, calls } = fakePage();
    await performAct(page, [
      { fill: { role: "textbox", name: "Message Moneypenny" }, value: "where is the leaderboard?" },
      { press: { role: "textbox", name: "Message Moneypenny" }, key: "Enter" },
      { await: { role: "link", name: "Leaderboard" } },
      { click: { role: "link", name: "Leaderboard" } },
    ]);
    expect(calls).toEqual([
      "fill textbox:Message Moneypenny where is the leaderboard?",
      "press textbox:Message Moneypenny Enter",
      "click link:Leaderboard",
    ]);
  });

  it("stops at the first action that cannot run, and names it", async () => {
    const { page, calls } = fakePage(["link:Leaderboard"]);
    await expect(
      performAct(page, [
        { await: { role: "link", name: "Leaderboard" } },
        { click: { role: "link", name: "Leaderboard" } },
      ]),
    ).rejects.toThrow(/^await link "Leaderboard" — .*not found/);
    expect(calls).toEqual([]);
  });

  it("refuses an action it does not know rather than skipping it", async () => {
    const { page } = fakePage();
    await expect(performAct(page, [{ hover: { text: "x" } }])).rejects.toThrow(
      /not one of click · fill · press · await/,
    );
  });

  it("describes each action in the words a failure shows", () => {
    expect(describeAction({ fill: { role: "textbox", name: "Box" }, value: "hi" })).toBe(
      'fill textbox "Box" with "hi"',
    );
    expect(describeAction({ press: { role: "textbox", name: "Box" }, key: "Enter" })).toBe(
      'press Enter in textbox "Box"',
    );
  });
});

describe("a step's after", () => {
  it("judges the hand-off where it landed, query keys included", async () => {
    const { page } = fakePage(["link:Eric"]);
    const misses = await afterMisses(page, {
      after: [
        { url: "/app/leaderboard?by=equity" },
        { url: "/app/leaderboard?by=month" },
        { role: "link", name: "Eric" },
      ],
    });
    expect(misses).toEqual([
      "after url /app/leaderboard?by=month — at /app/leaderboard?by=equity",
      'after link "Eric" — not found',
    ]);
  });

  it("holds when a step has none", async () => {
    expect(await afterMisses(fakePage().page, {})).toEqual([]);
  });
});

describe("a link expect with an href and no name", () => {
  it("looks for any visible link that goes there, not the first link on the page", async () => {
    const seen: string[] = [];
    const page = {
      locator: (selector: string) => {
        seen.push(selector);
        return {
          first: () => ({
            waitFor: async () => undefined,
            getAttribute: async () => "/app/leaderboard?by=month",
          }),
        };
      },
    };
    const held = await expectHolds(page, { role: "link", href: "/app/leaderboard" });
    expect(held.ok).toBe(true);
    expect(seen).toEqual(['a[href^="/app/leaderboard"]:visible']);
  });
});
