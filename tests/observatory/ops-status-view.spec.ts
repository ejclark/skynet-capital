import { renderOpsStatusBody } from "../../src/observatory/ops-status-view.js";
import type { OpsStatus } from "../../src/server/ops-status-service.js";

const base: OpsStatus = {
  generatedAt: "2026-08-28T12:00:00.000Z",
  degraded: false,
  signals: [
    { id: "a", label: "Signal A", verdict: "ok", detail: "all good" },
    {
      id: "b",
      label: "Signal B",
      verdict: "attention",
      detail: "needs a look",
      link: { href: "https://github.com/x/y/actions", label: "Open Actions" },
    },
    { id: "c", label: "Signal C", verdict: "unknown", detail: "can't tell" },
  ],
};

describe("renderOpsStatusBody", () => {
  it("renders one row per signal with its verdict and detail", () => {
    const html = renderOpsStatusBody(base);
    expect(html).toContain("Signal A");
    expect(html).toContain("OK");
    expect(html).toContain("Signal B");
    expect(html).toContain("ATTENTION");
    expect(html).toContain("Signal C");
    expect(html).toContain("UNKNOWN");
  });

  it("deep-links only the signals that carry a link", () => {
    const html = renderOpsStatusBody(base);
    expect(html).toContain('href="https://github.com/x/y/actions"');
    // Exactly one <a class="ops-link"> tag, even though "ops-link" also appears in the <style>
    // block's own selectors — count the anchor tags, not every substring match.
    expect(html.match(/<a class="ops-link"/g)?.length).toBe(1);
  });

  it("shows the degraded-mode caveat only when the status says so", () => {
    expect(renderOpsStatusBody(base)).not.toContain("Credential-free mode");
    expect(renderOpsStatusBody({ ...base, degraded: true })).toContain("Credential-free mode");
  });

  it("escapes signal text rather than trusting it as HTML", () => {
    const hostile: OpsStatus = {
      ...base,
      signals: [{ id: "x", label: "<script>alert(1)</script>", verdict: "ok", detail: "x" }],
    };
    expect(renderOpsStatusBody(hostile)).not.toContain("<script>alert(1)</script>");
  });
});
