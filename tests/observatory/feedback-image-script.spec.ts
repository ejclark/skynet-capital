import { IMAGE_SCRIPT } from "../../src/observatory/feedback-image-script.js";
import { renderFeedbackFormBody } from "../../src/observatory/feedback-view.js";

describe("feedback image-attachment client script", () => {
  const html = renderFeedbackFormBody({
    nav: { active: "feedback", canAdd: false, authed: true },
    enabled: true,
    coachEnabled: false,
  });

  it("stays safely embeddable inside the feedback page's TS template literal (CLAUDE.md TS1005 trap)", () => {
    expect(IMAGE_SCRIPT).not.toContain("`");
    expect(IMAGE_SCRIPT).not.toMatch(/\$\{/);
  });

  it("wires to every DOM id the attachment field actually renders", () => {
    for (const id of ["fdbk-image-input", "fdbk-images-field", "fdbk-image-list"]) {
      expect(html).toContain(`id="${id}"`);
      expect(IMAGE_SCRIPT).toContain(`'${id}'`);
    }
  });

  it("caps at 3 images client-side, matching the server's MAX_IMAGES", () => {
    expect(IMAGE_SCRIPT).toContain("MAX_IMAGES = 3");
  });

  it("downscales through a canvas and re-encodes as JPEG rather than sending the raw file", () => {
    expect(IMAGE_SCRIPT).toContain("canvas.toDataURL('image/jpeg', QUALITY)");
    expect(IMAGE_SCRIPT).toContain("type: 'image/jpeg'");
  });

  it("keeps the file input's raw selection out of the POST — only the hidden field's JSON rides it", () => {
    expect(html).toContain('<input type="file" id="fdbk-image-input" accept="image/*" multiple>');
  });

  it("attaches after the document is parsed, same guard as the other progressive-enhancement scripts", () => {
    expect(IMAGE_SCRIPT).toContain("document.readyState === 'loading'");
    expect(IMAGE_SCRIPT).toContain("DOMContentLoaded");
  });
});
