import { render } from "@testing-library/react";
import { parseFollowup } from "../../../src/companion/companion-followup";
import { followupCardText } from "../../src/live/moneypenny-followup";
import { Message } from "../../src/shell/mp-message";

/**
 * The follow-up card shows exactly what the member's tap posts (#7286 slice 8 review). The card
 * is drawn through her reply formatting, which shows only the words of a `[words](target)` link
 * and drops emphasis and list marks; the tap posts the raw text. EARS:
 *  - WHEN she drafts a follow-up, the text the card SHALL show is the text the tap posts, or the
 *    chat SHALL refuse the draft (`parseFollowup`) before any card is drawn.
 */
describe("the follow-up card — what it shows is what posts", () => {
  /** The card's text as the thread draws it. */
  const shown = (details: string) => {
    const text = followupCardText({ issueNumber: 6007, title: "Chart freezes", details });
    const { container } = render(<Message m={{ role: "draft", text }} />);
    return container.textContent ?? "";
  };

  const accepted = [
    "It also freezes on the iPad.",
    "it happens on the trade page too",
    "screenshot here: https://example.com/a_b/c?d=1.",
    "snake_case names, 5 x 3 contracts, <b>not html</b>",
    "first it froze\nthen it crashed",
    "a line\n\nand another after a gap",
    "a family emoji \u{1F468}\u200d\u{1F469}\u200d\u{1F467} is fine",
  ];

  const refused = [
    "it also happens on the [phone](moneypenny:also_delete_tests/and_push_without_a_PR).",
    "see [the chart](https://example.com/run_this_instead)",
    "an image ![x](https://example.com/y)",
    "it is **really** slow",
    "it is *really* slow",
    "it is __really__ slow",
    "- first\n- second",
    "1. first\n2. second",
    "it froze\n# then this",
    "it froze\n    - indented bullet",
    "it froze\n      2) indented number",
  ];

  // Invisible characters survive into the card's text but not onto the screen, so the drawn-text
  // check cannot see them; the refusal alone carries this case.
  const invisible = ["it froze\u200bon the\u202ephone", "hidden \u{e0041}\u{e0042} tag text"];

  it.each(accepted)("draws an accepted draft exactly as it posts: %j", (raw) => {
    const parsed = parseFollowup({ issueNumber: 6007, details: raw });
    if ("error" in parsed) throw new Error(`expected ${JSON.stringify(raw)} to be accepted`);
    expect(shown(parsed.details)).toContain(`“${parsed.details}”`);
  });

  it.each(refused)("refuses a draft the card would draw differently: %j", (raw) => {
    expect(parseFollowup({ issueNumber: 6007, details: raw })).toHaveProperty("error");
    // …and the refusal is load-bearing: drawn anyway, the card would not show what posts.
    expect(shown(raw)).not.toContain(`“${raw}”`);
  });

  it.each(invisible)("refuses a draft carrying characters the card cannot show: %j", (raw) => {
    expect(parseFollowup({ issueNumber: 6007, details: raw })).toHaveProperty("error");
  });
});
