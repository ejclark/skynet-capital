import { formatTranscript, type MpMessage } from "../../src/live/moneypenny";

/**
 * `formatTranscript` — the plain-text rendering the rail's copy control writes to the clipboard
 * (#1672 slice 2, NN/g's baseline "chat content should be savable" guideline). Pure, so it's
 * tested without mounting the rail or stubbing the clipboard.
 */
describe("formatTranscript", () => {
  const msg = (role: MpMessage["role"], text: string): MpMessage => ({ role, text });

  it("prefixes only the member's own lines — hers and the system's already self-identify", () => {
    const out = formatTranscript([
      msg("user", "hello"),
      msg("mp", "Moneypenny · hi there"),
      msg("sys", "sauron·ops · logged: something"),
    ]);
    expect(out).toBe("You: hello\n\nMoneypenny · hi there\n\nsauron·ops · logged: something");
  });

  it("never double-prefixes a Moneypenny line", () => {
    const out = formatTranscript([msg("mp", "Moneypenny · hi there")]);
    expect(out).not.toContain("Moneypenny · Moneypenny ·");
  });

  it("is empty for an empty thread", () => {
    expect(formatTranscript([])).toBe("");
  });

  it("keeps a draft card's own text as-is", () => {
    const card = '[bug] Title\n\ndetails\n\n— reply "send" to file it, or "never mind" to drop it.';
    expect(formatTranscript([msg("draft", card)])).toBe(card);
  });
});
