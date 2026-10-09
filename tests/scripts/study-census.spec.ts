import { describe, expect, it } from "@rstest/core";
import {
  type AxNode,
  axPick,
  CONTROL_ROLES,
  capControls,
  censusArgs,
  censusFindings,
  DEFAULT_CAP,
  keyed,
  leaveReason,
  nearest,
  nextScreen,
  onScreen,
  routeSlug,
  routesFor,
  tapPoint,
  treeOrder,
  walkOrder,
} from "../../scripts/study/census-plan.mjs";

// The machine census (#4943): the blind expert reviews every control on a world's routes, operated
// once, framed before and after — "a census done by machine, not chosen". These are the rules that
// make it the tree's list and not anyone's selection: which nodes are controls, in what order,
// what counts as on screen, where a tap lands, what is capped and what would leave the app.

const node = (
  nodeId: string,
  role: string,
  name: string,
  childIds: string[] = [],
  extra: Partial<AxNode> = {},
): AxNode => ({
  nodeId,
  role: { value: role },
  name: { value: name },
  childIds,
  backendDOMNodeId: Number(nodeId) * 10,
  ...extra,
});

describe("the accessibility tree, in document order", () => {
  // CDP returns the nodes in no promised order; the census walks them depth-first from the root.
  const nodes = [
    node("3", "button", "Second", [], { parentId: "1" }),
    node("1", "RootWebArea", "Page", ["2", "3", "4"]),
    node("2", "link", "First", [], { parentId: "1" }),
    node("4", "combobox", "Account", ["5"], { parentId: "1" }),
    node("5", "MenuListPopup", "", ["6"], { parentId: "4" }),
    node("6", "option", "Both", [], { parentId: "5" }),
  ];

  it("walks depth-first from the root, whatever order CDP sent", () => {
    expect(treeOrder(nodes).map((n) => n.name)).toEqual([
      "Page",
      "First",
      "Second",
      "Account",
      "",
      "Both",
    ]);
  });

  it("lower-cases Chromium's internal role names", () => {
    expect(treeOrder([node("1", "DisclosureTriangle", "More")])[0]?.role).toBe(
      "disclosuretriangle",
    );
    expect(CONTROL_ROLES.has("disclosuretriangle")).toBe(true);
  });

  it("does not list a closed select's options as taps of their own", () => {
    const { controls } = axPick(treeOrder(nodes));
    expect(controls.map((c) => `${c.role} ${c.name}`)).toEqual([
      "link First",
      "button Second",
      "combobox Account",
    ]);
  });

  it("drops ignored nodes and keeps named headings apart", () => {
    const picked = axPick(
      treeOrder([
        node("1", "RootWebArea", "", ["2", "3", "4"]),
        node("2", "button", "Hidden", [], { parentId: "1", ignored: true }),
        node("3", "heading", "Positions", [], { parentId: "1" }),
        node("4", "heading", "", [], { parentId: "1" }),
      ]),
    );
    expect(picked.controls).toEqual([]);
    expect(picked.headings.map((h) => h.name)).toEqual(["Positions"]);
  });

  it("squashes whitespace in names", () => {
    expect(treeOrder([node("1", "link", "  Review\n on   Trade ")])[0]?.name).toBe(
      "Review on Trade",
    );
  });
});

describe("the screen-by-screen walk", () => {
  it("steps one viewport at a time and lands exactly on the bottom", () => {
    expect(nextScreen(0, { scrollHeight: 2000, innerHeight: 800 })).toBe(800);
    expect(nextScreen(800, { scrollHeight: 2000, innerHeight: 800 })).toBe(1200);
    expect(nextScreen(1200, { scrollHeight: 2000, innerHeight: 800 })).toBeNull();
  });

  it("takes one screen when the page does not scroll", () => {
    expect(nextScreen(0, { scrollHeight: 700, innerHeight: 800 })).toBeNull();
  });

  it("walks a page that grew while it was scrolled to its new end", () => {
    expect(nextScreen(800, { scrollHeight: 4000, innerHeight: 800 })).toBe(1600);
  });
});

describe("on screen", () => {
  const vp = { width: 390, height: 844 };
  it("counts any part inside the viewport, when the browser shows it", () => {
    expect(onScreen({ shown: true, box: { left: 10, top: 830, width: 50, height: 40 } }, vp)).toBe(
      true,
    );
    expect(onScreen({ shown: true, box: { left: 10, top: 850, width: 50, height: 40 } }, vp)).toBe(
      false,
    );
    expect(onScreen({ shown: true, box: { left: 400, top: 10, width: 50, height: 40 } }, vp)).toBe(
      false,
    );
  });

  it("never counts a hidden or zero-size (fully clipped) box", () => {
    expect(onScreen({ shown: false, box: { left: 10, top: 10, width: 50, height: 40 } }, vp)).toBe(
      false,
    );
    expect(onScreen({ shown: true, box: { left: 10, top: 10, width: 0, height: 40 } }, vp)).toBe(
      false,
    );
    expect(onScreen(null, vp)).toBe(false);
  });
});

describe("where the tap lands", () => {
  const vp = { width: 390, height: 844 };
  it("is the centre of the control's visible part", () => {
    expect(tapPoint({ left: 10, top: 100, width: 100, height: 40 }, vp)).toEqual({ x: 60, y: 120 });
    // Half below the fold: the centre of what shows, not of the whole box.
    expect(tapPoint({ left: 0, top: 800, width: 100, height: 100 }, vp)).toEqual({ x: 50, y: 822 });
  });

  it("is nowhere when nothing of it is inside", () => {
    expect(tapPoint({ left: 0, top: 900, width: 100, height: 40 }, vp)).toBeNull();
  });
});

describe("controls that would leave the app are skipped, with why", () => {
  const origin = "http://127.0.0.1:5000";
  it("keeps same-origin links, hashes and buttons", () => {
    expect(leaveReason({ href: "/app/trade?x=1" }, origin)).toBeNull();
    expect(leaveReason({ href: "#pos-1" }, origin)).toBeNull();
    expect(leaveReason(null, origin)).toBeNull();
  });

  it("names the host, the scheme or the download", () => {
    expect(leaveReason({ href: "https://www.sec.gov/x" }, origin)).toBe(
      "leaves the app for www.sec.gov",
    );
    expect(leaveReason({ href: "mailto:a@b.c" }, origin)).toBe("opens mailto: outside the app");
    expect(leaveReason({ href: "/report.csv", download: true }, origin)).toBe("starts a download");
  });
});

describe("identity, the cap and finding a control again", () => {
  it("numbers same-named controls in tree order", () => {
    const out = keyed([
      { role: "button", name: "Close" },
      { role: "link", name: "Close" },
      { role: "button", name: "Close" },
    ]);
    expect(out.map((c) => c.key)).toEqual(["button|Close|0", "link|Close|0", "button|Close|1"]);
  });

  it("keeps the first N in tree order and hands back the rest to log", () => {
    const { kept, dropped } = capControls([1, 2, 3, 4], 3);
    expect(kept).toEqual([1, 2, 3]);
    expect(dropped).toEqual([4]);
    expect(capControls(Array.from({ length: 70 }, (_, i) => i)).kept).toHaveLength(DEFAULT_CAP);
  });

  it("re-finds a control as the same-named candidate nearest where the walk saw it", () => {
    const pick = nearest(
      [{ i: 0, doc: { x: 10, y: 100 } }, { i: 1, doc: { x: 10, y: 1900 } }, { i: 2 }],
      { x: 12, y: 1880 },
    );
    expect(pick?.i).toBe(1);
    expect(nearest([], { x: 0, y: 0 })).toBeNull();
  });

  it("orders the walk by the last tree read, then what only one screen held", () => {
    const found = [{ backendId: 3 }, { backendId: 1 }, { backendId: 9 }];
    expect(walkOrder(found, [1, 2, 3]).map((c) => c.backendId)).toEqual([1, 3, 9]);
  });
});

describe("the census's own findings", () => {
  it("flags a control a screen reader cannot name", () => {
    expect(censusFindings({ name: "", role: "button" }).map((f) => f.kind)).toEqual([
      "unnamed-control",
    ]);
  });

  it("flags a control whose centre something else covers", () => {
    const [f] = censusFindings({
      name: "Next",
      role: "button",
      cover: { inside: false, by: "div.blend" },
    });
    expect(f?.kind).toBe("control-covered");
    expect(f?.what).toContain("div.blend");
    expect(censusFindings({ name: "Next", role: "button", cover: { inside: true } })).toEqual([]);
  });

  it("flags a control a fresh load does not render where the walk saw it", () => {
    expect(censusFindings({ name: "Row", role: "link", operated: "not-found" })[0]?.kind).toBe(
      "control-unstable",
    );
  });
});

describe("routes and arguments", () => {
  it("takes the world's routes for one viewer, once each, never a struck surface", () => {
    const surfaces = [
      { viewer: "a", route: "/x" },
      { viewer: "b", route: "/y" },
      { viewer: "a", route: "/x" },
      { viewer: "a", route: "/z", struck: "cannot render" },
      { viewer: "a", route: "/w" },
    ];
    expect(routesFor(surfaces, "a")).toEqual(["/x", "/w"]);
  });

  it("turns a route into a folder name", () => {
    expect(routeSlug("/app/page?item=x&tab=y")).toBe("app-page-item-x-tab-y");
    expect(routeSlug("/")).toBe("root");
  });

  it("parses the CLI, defaulting to both frames and the cap", () => {
    const a = censusArgs(["--run", "r", "--world", "w", "--viewer", "v", "--out", "o"]);
    expect(a).toMatchObject({ viewports: ["phone", "desktop"], cap: DEFAULT_CAP, routes: [] });
    const b = censusArgs([
      "--run",
      "r",
      "--world",
      "w",
      "--viewer",
      "v",
      "--out",
      "o",
      "--viewport",
      "phone",
      "--cap",
      "5",
      "--route",
      "/a",
    ]);
    expect(b).toMatchObject({ viewports: ["phone"], cap: 5, routes: ["/a"] });
  });

  it("refuses a missing flag, a bad cap and an unknown frame", () => {
    expect(() => censusArgs(["--run", "r"])).toThrow(/--world is required/);
    expect(() =>
      censusArgs(["--run", "r", "--world", "w", "--viewer", "v", "--out", "o", "--cap", "0"]),
    ).toThrow(/--cap/);
    expect(() =>
      censusArgs([
        "--run",
        "r",
        "--world",
        "w",
        "--viewer",
        "v",
        "--out",
        "o",
        "--viewport",
        "tablet",
      ]),
    ).toThrow(/--viewport/);
  });
});
