import { renderMarkdownPreview } from "../../src/ui/markdown-preview.js";

// The Preview tab renders text a member typed, so half of this spec is the attack surface and half
// is "does the capsule shape (docs/ISSUES.md) actually render". Escape-first is the invariant: if
// any of the injection cases below ever emit a live tag, the honest fix is the renderer, never the
// spec.
describe("renderMarkdownPreview — the capsule constructs", () => {
  it("renders talking points as a list", () => {
    const html = renderMarkdownPreview("- first point\n- second point\n");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>first point</li>");
  });

  it("renders the metadata table members and the coach are asked for", () => {
    const html = renderMarkdownPreview("| Type | Surface |\n|---|---|\n| bug | /leaderboard |\n");
    expect(html).toContain("<th>Type</th>");
    expect(html).toContain("<td>/leaderboard</td>");
  });

  it("keeps the fold a real fold — the one raw-HTML pair the shape depends on", () => {
    const html = renderMarkdownPreview(
      "<details>\n<summary>The brief</summary>\n\ndetail\n\n</details>",
    );
    expect(html).toContain("<details>");
    expect(html).toContain("<summary>The brief</summary>");
    expect(html).toContain("<p>detail</p>");
  });

  it("renders emphasis, inline code, headings and quotes", () => {
    const html = renderMarkdownPreview(
      "## Heading\n\n**bold** and *soft* and `code`\n\n> quoted\n",
    );
    expect(html).toContain("<h3>Heading</h3>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>soft</em>");
    expect(html).toContain("<code>code</code>");
    expect(html).toContain("<blockquote>");
  });

  it("leaves fenced code untouched, markdown and all", () => {
    const html = renderMarkdownPreview("```js\nconst a = **not bold**;\n```\n");
    expect(html).toContain("<pre><code>const a = **not bold**;</code></pre>");
  });

  it("links only http, https and mailto", () => {
    expect(renderMarkdownPreview("[docs](https://example.com/x)")).toContain(
      '<a href="https://example.com/x" target="_blank" rel="noopener noreferrer">docs</a>',
    );
    const sneaky = renderMarkdownPreview("[click](javascript:alert(1))");
    expect(sneaky).not.toContain("<a ");
    expect(sneaky).toContain("click (javascript:alert(1))");
  });
});

describe("renderMarkdownPreview — escape-first", () => {
  it("never emits a script tag a member typed", () => {
    const html = renderMarkdownPreview("<script>alert('x')</script>");
    expect(html).not.toContain("<script");
    expect(html).toContain("&lt;script&gt;");
  });

  it("never emits an event handler on a smuggled element", () => {
    const html = renderMarkdownPreview(
      '<img src=x onerror="alert(1)">\n\n<div onclick="x()">hi</div>',
    );
    // The handler text survives as inert escaped characters — what must never survive is a tag.
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<div");
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  });

  it("allows no attributes even on the whitelisted fold tags", () => {
    const html = renderMarkdownPreview(
      '<details onclick="steal()">\n<summary>x</summary>\n</details>',
    );
    expect(html).not.toContain("<details onclick");
    expect(html).toContain("&lt;details onclick=&quot;steal()&quot;&gt;");
  });

  it("cannot be tricked by a hand-typed placeholder token", () => {
    // The stash markers are NUL-delimited — untypeable in a textarea — so a member writing the
    // visible form of one gets literal text back, never someone else's stashed span.
    const html = renderMarkdownPreview("c0 and f0 are just text\n");
    expect(html).toContain("c0 and f0 are just text");
  });

  it("escapes quotes inside table cells and headings", () => {
    const html = renderMarkdownPreview('| a |\n|---|\n| "><b>x</b> |\n');
    expect(html).not.toContain("<b>x</b>");
    expect(html).toContain("&quot;&gt;&lt;b&gt;");
  });
});
