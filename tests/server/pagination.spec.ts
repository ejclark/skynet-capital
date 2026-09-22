import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  nextLinkHeader,
  paginateDesc,
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
