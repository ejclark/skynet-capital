import { welcomeHtml } from "../../src/server/welcome-page.js";

describe("the public /welcome guide", () => {
  it("walks the three-step join path and is honest that it's paper only", () => {
    const html = welcomeHtml();
    expect(html).toContain("Join in three steps");
    expect(html).toContain("Sign in");
    expect(html).toContain("Alpaca paper account");
    expect(html).toContain("no real money, ever");
    expect(html).toContain('href="/login"');
    expect(html).toContain('href="/learn"');
  });
});
