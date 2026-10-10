import { describe, expect, it } from "@rstest/core";
import { VERBS } from "../../scripts/steer/html.mjs";
import { renderPage, TITLE } from "../../scripts/steer/render.mjs";
import { fixture } from "./steer-fixture";

// #5056 criteria 4, 8 and 11 plus the accessibility constraint, asserted on the generated page:
// the irreversible class is a link and never a button, a pressed state never rests on colour
// alone (a standing reader is red/green colourblind, docs/BRAND.md), and both themes are defined.
const html = renderPage(fixture(), {
  img: (p) => ("local" in p && p.local) || ("src" in p ? p.src : null) || null,
});
const css = /<style>([\s\S]*?)<\/style>/.exec(html)?.[1] ?? "";
const section = (id: string) => {
  const start = html.indexOf(`id="${id}"`);
  const end = html.indexOf("</section>", start);
  return html.slice(start, end);
};

describe("the irreversible class is a link to GitHub, never a button", () => {
  it("renders a held PR's merge as a link to the PR", () => {
    const held = section("d-4300");
    expect(held).toContain('href="https://github.com/ejclark/skynet-capital/pull/4300"');
    expect(held).toMatch(/Open #4300 on GitHub to merge it/);
    expect(held).not.toContain("<button");
  });

  it("offers buttons on the reversible decisions", () => {
    expect(section("d-4100")).toContain('data-v="approve"');
    expect(section("d-2224")).toContain('data-v="build"');
  });

  it("links the dial instead of offering to change it, and queues nothing under halt", () => {
    const base = fixture();
    expect(section("queue")).toContain(
      'href="https://github.com/ejclark/skynet-capital/issues/4153"',
    );
    const halted = renderPage(
      fixture({ queue: { ...base.queue, position: "halt", halt: true, items: [] } }),
    );
    const q = halted.slice(halted.indexOf('id="queue"'));
    expect(q).toMatch(/Work is halted/);
    expect(q.slice(0, q.indexOf("</section>"))).not.toContain("<button");
    expect(halted.indexOf("Work is halted")).toBeLessThan(halted.indexOf('id="shipped"'));
  });
});

describe("a pressed state never rests on colour alone", () => {
  const values = [...html.matchAll(/<button[^>]*data-v="([a-z]+)"/g)].map((m) => m[1] ?? "");
  const used = new Set(values);

  it("covers every reaction the page can render", () => {
    for (const pairs of Object.values(VERBS)) for (const [v] of pairs) used.add(v);
    expect([...used].sort()).toEqual([
      "approve",
      "build",
      "bump",
      "done",
      "hold",
      "more",
      "not",
      "revisit",
      "veto",
    ]);
  });

  it("gives each one a glyph when pressed", () => {
    const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
      sel: m[1] ?? "",
      body: m[2] ?? "",
    }));
    for (const v of used) {
      const glyph = rules.some(
        (r) =>
          r.sel.includes(`.rb[data-v="${v}"][aria-pressed="true"]::before`) &&
          /content:\s*"[^"\s][^"]*"/.test(r.body),
      );
      expect({ v, glyph }).toEqual({ v, glyph: true });
    }
  });

  it("and a heavier border on top of the glyph, so a pressed button changes shape too", () => {
    expect(css).toMatch(/\.rb\[aria-pressed="true"\]\s*\{[^}]*border-width:\s*3px/);
  });
});

describe("both themes, from BRAND tokens", () => {
  const block = (sel: RegExp) => sel.exec(css)?.[1] ?? "";
  const tokens = (body: string) => new Set([...body.matchAll(/(--[a-z0-9-]+):/g)].map((m) => m[1]));
  const root = tokens(block(/^:root\s*\{([^}]*)\}/m));
  const media = tokens(
    block(
      /prefers-color-scheme:\s*light\)\s*\{\s*:root:not\(\[data-theme="dark"\]\)\s*\{([^}]*)\}/,
    ),
  );
  const explicit = tokens(block(/:root\[data-theme="light"\]\s*\{([^}]*)\}/));

  it("defines every colour token on the bare root, then again for light by media query and by toggle", () => {
    const colours = [...root].filter((t) => t && !["--sans", "--mono"].includes(t));
    expect(colours.length).toBeGreaterThan(8);
    for (const t of colours) {
      expect({ t, media: media.has(t), toggle: explicit.has(t) }).toEqual({
        t,
        media: true,
        toggle: true,
      });
    }
  });

  it("paints the body from a token", () => {
    expect(css).toMatch(/body\s*\{[^}]*background:\s*var\(--bg\)/);
  });
});

describe("the page's shape", () => {
  it("is named once, stably, before anything else", () => {
    expect(html.startsWith(`<title>${TITLE}</title>`)).toBe(true);
  });

  it("orders the budget line, what shipped, the decisions, the queue, the strip, then Done", () => {
    const order = [
      'class="top"',
      'id="shipped"',
      'id="decisions"',
      'id="queue"',
      'id="progress"',
      'id="done"',
    ];
    const at = order.map((s) => html.indexOf(s));
    expect(at.every((x) => x >= 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
  });

  it("shows a design question's Today first, as a real screenshot, then its options", () => {
    const q1 = section("d-5037-q1");
    expect(q1.indexOf('class="opt today"')).toBeLessThan(q1.indexOf('id="d-5037-q1-A"'));
    expect(q1).toContain("real screenshot");
    expect(q1).toMatch(/If you skip:<\/b> this round stays open/);
  });

  it("says why a merge happened when one of Eric's decisions caused it", () => {
    expect(section("shipped")).toContain("make the squares easier to hit");
  });

  it("asks nothing wider than a phone: no fixed min-width past 390px", () => {
    // A declaration, not a media query: `(min-width: 861px)` is preceded by "(" and is skipped.
    const widths = [...css.matchAll(/(?<!\()\bmin-width:\s*(\d+)px/g)].map((m) => Number(m[1]));
    for (const w of widths) expect(w).toBeLessThanOrEqual(390);
  });

  it("escapes titles and keeps the embedded data from closing its script tag", () => {
    const evil = fixture();
    const first = evil.decisions[0];
    if (first) first.title = '</script><img src=x onerror="alert(1)">';
    const out = renderPage(evil);
    expect(out).not.toContain('<img src=x onerror="alert(1)">');
    const data =
      /<script type="application\/json" id="tp-data">([\s\S]*?)<\/script>/.exec(out)?.[1] ?? "";
    expect(data).not.toContain("<");
    expect(JSON.parse(data).decisions[0].title).toBe(first?.title);
  });
});

describe("decisions that roll to the next page are named, not just numbered", () => {
  it("names each rolled decision by its title, so three questions on one issue read as three", () => {
    const tp = fixture();
    const rolled = {
      ...tp,
      deferred: [
        { key: "5037-q3", issue: 5037, title: "What does the sticky head hold?", minutes: 4 },
        { key: "5037-q7", issue: 5037, title: "How does cash read beside net worth?", minutes: 4 },
      ],
    };
    const out = renderPage(rolled);
    expect(out).toContain("What does the sticky head hold? (#5037)");
    expect(out).toContain("How does cash read beside net worth? (#5037)");
    expect(out).not.toContain("#5037, #5037");
  });
});
