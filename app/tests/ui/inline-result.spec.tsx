import { render, screen } from "@testing-library/react";
import { InlineResult } from "../../src/ui";

/**
 * The one-sentence outcome line (#5365). WHEN an action finishes, the line SHALL carry the
 * caller's sentence word for word in the ok or err class, whose sheet draws a ✓ or ✕ before it, so
 * the outcome never reads by hue alone (docs/BRAND.md → Accessibility); it SHALL announce itself as
 * a status (ok) or an alert (err) UNLESS the caller says an ancestor already does.
 */

describe("InlineResult", () => {
  it("draws a success in the tick class and announces it as a status", () => {
    render(<InlineResult tone="ok">Saved — Eric is up to date.</InlineResult>);
    const line = screen.getByRole("status");
    expect(line).toHaveTextContent("Saved — Eric is up to date.");
    expect(line).toHaveClass("set-ok");
    expect(line).not.toHaveClass("set-err");
    expect(line.tagName).toBe("P");
  });

  it("draws a failure in the cross class and announces it as an alert", () => {
    render(<InlineResult tone="err">Couldn't load older trades — try again.</InlineResult>);
    const line = screen.getByRole("alert");
    expect(line).toHaveTextContent("Couldn't load older trades — try again.");
    expect(line).toHaveClass("set-err");
    expect(line).not.toHaveClass("set-ok");
  });

  it("keeps the sentence's own markup and adds no glyph to the text", () => {
    render(
      <InlineResult tone="ok">
        Key replaced — <b>Eric</b> streams on the new credential.
      </InlineResult>,
    );
    const line = screen.getByRole("status");
    expect(line.querySelector("b")).toHaveTextContent("Eric");
    expect(line.textContent?.startsWith("Key replaced")).toBe(true);
  });

  it("stays quiet inside a live region the caller already owns", () => {
    const { container } = render(
      <InlineResult tone="err" live={false}>
        That unlock was already claimed.
      </InlineResult>,
    );
    expect(screen.queryByRole("alert")).toBeNull();
    expect(container.querySelector(".set-err")).toHaveTextContent(
      "That unlock was already claimed.",
    );
  });

  it("sits inline as a span, keeping a surface's layout class beside the mark", () => {
    render(
      <InlineResult as="span" tone="err" className="tkt-close-note">
        Market is closed.
      </InlineResult>,
    );
    const line = screen.getByRole("alert");
    expect(line.tagName).toBe("SPAN");
    expect(line).toHaveClass("set-err", "tkt-close-note");
  });
});
