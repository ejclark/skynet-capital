import { clientOrderIdFor, clientOrderIdPrefix } from "../../src/autonomous/client-order-id.js";
import { CLIENT_ORDER_ID_PATTERN } from "../../src/domain/option-order.js";

describe("client order ids", () => {
  it("encode the persona, the underlying, the cycle's clock and the intent's place in it", () => {
    const at = Date.parse("2026-10-07T15:00:00Z");
    expect(clientOrderIdFor("sauron", "CRWV", at, 2)).toBe(`sk1-sauron-CRWV-${at.toString(36)}-2`);
  });

  it("slug the persona to at most 16 lowercase letters and digits, inside Alpaca's alphabet", () => {
    const id = clientOrderIdFor("Sauron_Hardcore.Research-Build", "NVDA", Date.now(), 0);
    expect(id.startsWith("sk1-sauronhardcorere-NVDA-")).toBe(true);
    expect(id).toMatch(CLIENT_ORDER_ID_PATTERN);
    expect(id.length).toBeLessThanOrEqual(48);
  });

  it("every id a persona's bot stamps starts with its prefix — what a boot sweep cancels by", () => {
    const prefix = clientOrderIdPrefix("sauron");
    expect(prefix).toBe("sk1-sauron-");
    expect(clientOrderIdFor("sauron", "NVDA", 1, 0).startsWith(prefix)).toBe(true);
    expect(clientOrderIdFor("sauron-2", "NVDA", 1, 0).startsWith(prefix)).toBe(false);
  });
});
