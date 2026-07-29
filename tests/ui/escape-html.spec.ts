import { escapeHtml } from "../../src/ui/escape-html.js";

describe("escapeHtml", () => {
  it("passes plain text through unchanged", () => {
    expect(escapeHtml("Barad-dur")).toBe("Barad-dur");
  });

  it("returns an empty string for an empty string", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("escapes ampersands", () => {
    expect(escapeHtml("bots & bulls")).toBe("bots &amp; bulls");
  });

  it("escapes less-than and greater-than signs", () => {
    expect(escapeHtml("<script>alert(1)</script>")).toBe("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("escapes double quotes", () => {
    expect(escapeHtml('say "hi"')).toBe("say &quot;hi&quot;");
  });

  it("leaves single quotes unescaped, matching the documented contract", () => {
    // The doc comment on escapeHtml only promises &, <, >, and " — single
    // quotes are intentionally out of scope. Callers embedding into a
    // single-quoted HTML attribute must not rely on this helper alone.
    expect(escapeHtml("it's fine")).toBe("it's fine");
  });

  it("escapes ampersands before other entities so it never double-escapes its own output", () => {
    // & is replaced first; if < were replaced first, "<" -> "&lt;" and then
    // the & replacement would corrupt it into "&amp;lt;". Assert the actual
    // (correct) ordering produces a single, valid escape.
    expect(escapeHtml("<")).toBe("&lt;");
    expect(escapeHtml("&lt;")).toBe("&amp;lt;");
  });

  it("escapes every dangerous character in a single mixed payload", () => {
    const input = `<img src=x onerror="alert('xss')">& more`;
    expect(escapeHtml(input)).toBe("&lt;img src=x onerror=&quot;alert('xss')&quot;&gt;&amp; more");
  });

  it("escapes repeated occurrences of the same character, not just the first", () => {
    expect(escapeHtml("<<<>>>")).toBe("&lt;&lt;&lt;&gt;&gt;&gt;");
  });

  it("is idempotent-safe in the sense that escaping an already-escaped string re-escapes the ampersand rather than silently passing it through", () => {
    const once = escapeHtml("<b>");
    const twice = escapeHtml(once);
    expect(once).toBe("&lt;b&gt;");
    expect(twice).toBe("&amp;lt;b&amp;gt;");
    expect(twice).not.toBe(once);
  });

  it("handles a string composed only of dangerous characters", () => {
    expect(escapeHtml(`&<>"`)).toBe("&amp;&lt;&gt;&quot;");
  });

  it("preserves whitespace and unicode characters untouched", () => {
    expect(escapeHtml("  café ☕ <safe>  ")).toBe("  café ☕ &lt;safe&gt;  ");
  });
});
