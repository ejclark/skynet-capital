import { readFileSync } from "node:fs";
import { BOARD_RANKINGS, PLACES, placeHref } from "../../../src/companion/places";
import { BOARD_METRICS } from "../../src/live/board";
import { linkPieces, plainLine } from "../../src/live/moneypenny-links";

// #5238 — every place Moneypenny names is a link, but only to a route on the allow-list.
describe("linkPieces", () => {
  it("turns a named place into a link to its route", () => {
    expect(linkPieces("the last step: [open Trade](/trade) and buy a stock")).toEqual([
      { kind: "text", text: "the last step: " },
      { kind: "place", text: "open Trade", path: "/trade" },
      { kind: "text", text: " and buy a stock" },
    ]);
  });

  it("keeps a control's state — a ranking on the Leaderboard — in the link", () => {
    expect(linkPieces("tap [Return %](/leaderboard?by=return) above the list")).toContainEqual({
      kind: "place",
      text: "Return %",
      path: "/leaderboard?by=return",
    });
  });

  it("leaves a place she invents as plain words, the markup gone", () => {
    expect(linkPieces("see [the vault](/vault) or [admin](//evil.example)")).toEqual([
      { kind: "text", text: "see the vault or admin" },
    ]);
    expect(linkPieces("[Trade](/trade/../settings)")).toEqual([{ kind: "text", text: "Trade" }]);
  });

  it("still links a bare app path and an outside URL, leaving a full stop outside", () => {
    expect(linkPieces("go to /leaderboard?by=pl. or https://github.com/x/y/issues/9.")).toEqual([
      { kind: "text", text: "go to " },
      { kind: "place", text: "/leaderboard?by=pl", path: "/leaderboard?by=pl" },
      { kind: "text", text: ". or " },
      {
        kind: "url",
        text: "https://github.com/x/y/issues/9",
        href: "https://github.com/x/y/issues/9",
      },
      { kind: "text", text: "." },
    ]);
  });

  it("never reads a fraction or P/L as a path", () => {
    expect(linkPieces("P/L and/or /tradex")).toEqual([
      { kind: "text", text: "P/L and/or /tradex" },
    ]);
  });

  it("pastes as the words she linked", () => {
    expect(plainLine("[open Trade](/trade) now")).toBe("open Trade now");
  });
});

describe("the allow-list", () => {
  const tree = readFileSync(new URL("../../src/routeTree.gen.ts", import.meta.url), "utf8");

  it("names only routes the app really has", () => {
    for (const p of PLACES) expect(tree).toContain(`'${p.path}': typeof`);
  });

  it("matches the Leaderboard's own rankings", () => {
    expect(BOARD_RANKINGS.map((r) => [r.by, r.label])).toEqual(
      BOARD_METRICS.map((m) => [m.key, m.label]),
    );
  });

  it("matches exact routes, query allowed", () => {
    expect(placeHref("/trade?play=101&mode=guided")).toBe("/trade?play=101&mode=guided");
    expect(placeHref("/learn/trading")).toBe("/learn/trading");
    expect(placeHref("/tradex")).toBeUndefined();
    expect(placeHref("https://example.com")).toBeUndefined();
  });
});
