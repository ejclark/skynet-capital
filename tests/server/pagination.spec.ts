import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  nextLinkHeader,
  paginateDesc,
  paginateDescBy,
  resolvePageSize,
} from "../../src/server/pagination.js";

describe("resolvePageSize", () => {
  it("defaults to 30 when absent", () => {
    expect(resolvePageSize(null)).toBe(DEFAULT_PAGE_SIZE);
    expect(resolvePageSize(undefined)).toBe(DEFAULT_PAGE_SIZE);
  });

  it("accepts 50 and 100", () => {
    expect(resolvePageSize("50")).toBe(50);
    expect(resolvePageSize("100")).toBe(100);
  });

  it("clamps anything above the ceiling, never errors", () => {
    expect(resolvePageSize("1000")).toBe(MAX_PAGE_SIZE);
  });

  it("falls back to the default on malformed or non-positive input", () => {
    expect(resolvePageSize("not-a-number")).toBe(DEFAULT_PAGE_SIZE);
    expect(resolvePageSize("0")).toBe(DEFAULT_PAGE_SIZE);
    expect(resolvePageSize("-5")).toBe(DEFAULT_PAGE_SIZE);
  });

  it("floors a fractional request", () => {
    expect(resolvePageSize("30.9")).toBe(30);
  });
});

describe("paginateDesc", () => {
  const items = [5, 4, 3, 2, 1]; // already sorted newest(largest)-first

  it("returns everything with no cursor when the page isn't full", () => {
    const page = paginateDesc(items, (n) => n, { limit: 10 });
    expect(page.items).toEqual(items);
    expect(page.nextCursor).toBeUndefined();
  });

  it("carries a nextCursor exactly when the page is full", () => {
    const page = paginateDesc(items, (n) => n, { limit: 2 });
    expect(page.items).toEqual([5, 4]);
    expect(page.nextCursor).toBe(4);
  });

  it("the exclusive before boundary never repeats the boundary row", () => {
    const first = paginateDesc(items, (n) => n, { limit: 2 });
    const second = paginateDesc(items, (n) => n, { limit: 2, before: first.nextCursor });
    expect(second.items).toEqual([3, 2]);
    expect(second.items).not.toContain(first.nextCursor);
  });

  it("works with string keys (ISO timestamps) the same way", () => {
    const stamps = ["2026-08-23T00:00:00Z", "2026-08-22T00:00:00Z", "2026-08-21T00:00:00Z"];
    const page = paginateDesc(stamps, (s) => s, { limit: 1 });
    expect(page.items).toEqual(["2026-08-23T00:00:00Z"]);
    expect(page.nextCursor).toBe("2026-08-23T00:00:00Z");
  });
});

// #4802: a page that ends on row A at time T must not lose row B, also at T, to the next page's
// strictly-older filter. The cursor carries T and A's id; the sort breaks ties by id.
describe("paginateDescBy — rows that share a timestamp", () => {
  const T1 = "2026-10-16T20:00:00.000Z";
  const T2 = "2026-10-16T21:00:00.000Z";
  const rows = [
    { id: "a", at: T2 },
    { id: "b", at: T1 },
    { id: "c", at: T1 },
    { id: "d", at: T2 },
    { id: "e", at: T1 },
    { id: "f", at: "2026-10-16T19:00:00.000Z" },
  ];
  const at = (r: { at: string }) => r.at;
  const id = (r: { id: string }) => r.id;

  const walk = (limit: number): string[] => {
    const seen: string[] = [];
    let before: string | undefined;
    for (let hop = 0; hop <= rows.length; hop++) {
      const page = paginateDescBy(rows, at, id, { limit, ...(before ? { before } : {}) });
      seen.push(...page.items.map(id));
      if (page.nextCursor === undefined) break;
      before = page.nextCursor;
    }
    return seen;
  };

  it("returns every row exactly once, newest first, at every page size", () => {
    for (let limit = 1; limit <= rows.length; limit++) {
      expect(walk(limit)).toEqual(["d", "a", "e", "c", "b", "f"]);
    }
  });

  it("names the boundary row's time and id in the cursor", () => {
    expect(paginateDescBy(rows, at, id, { limit: 3 }).nextCursor).toBe(`${T1}|e`);
  });

  it("still takes a bare timestamp cursor, as strictly older than it", () => {
    const page = paginateDescBy(rows, at, id, { limit: 10, before: T2 });
    expect(page.items.map(id)).toEqual(["e", "c", "b", "f"]);
  });
});

describe("nextLinkHeader", () => {
  it("builds a GitHub-style Link header, resolving a relative request URL", () => {
    const header = nextLinkHeader("/api/wire?symbol=NVDA", { per_page: "30", before: "42" });
    expect(header).toBe('</api/wire?symbol=NVDA&per_page=30&before=42>; rel="next"');
  });

  it("overwrites an existing param of the same name rather than duplicating it", () => {
    const header = nextLinkHeader("/api/wire?per_page=10", { per_page: "30" });
    expect(header).toBe('</api/wire?per_page=30>; rel="next"');
  });
});
