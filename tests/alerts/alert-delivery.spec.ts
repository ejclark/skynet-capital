import type { Alert } from "../../src/alerts/alert.js";
import {
  type AlertDeliveryPrefs,
  DELIVERY_OFF,
  deliveryFingerprint,
  deliveryMessage,
  parseChannel,
  parsePriority,
  shouldDeliver,
} from "../../src/alerts/alert-delivery.js";

/**
 * The pure half of delivery: who gets sent what. The rules that matter are the ones a member would
 * notice being broken — off by default, a floor that holds, no destination means no send, and a
 * message that repeats the producer's own words and adds no number of its own.
 */

const alert = (over: Partial<Alert> = {}): Alert => ({
  id: "a1",
  at: 1_000,
  source: "position-watch",
  priority: "critical",
  title: "NVDA 180 call is in the money — assignment risk",
  symbol: "NVDA",
  ...over,
});

const prefs = (over: Partial<AlertDeliveryPrefs> = {}): AlertDeliveryPrefs => ({
  channel: "email",
  minPriority: "warning",
  destination: "ann@x.com",
  ...over,
});

describe("shouldDeliver", () => {
  it("sends nothing by default — a member who never opted in is never mailed", () => {
    expect(DELIVERY_OFF.channel).toBe("off");
    expect(shouldDeliver(alert(), DELIVERY_OFF)).toBe(false);
  });

  it("holds the member's floor: an info alert never rides a warning-and-louder setting", () => {
    expect(shouldDeliver(alert({ priority: "warning" }), prefs())).toBe(true);
    expect(shouldDeliver(alert({ priority: "info" }), prefs())).toBe(false);
    expect(shouldDeliver(alert({ priority: "info" }), prefs({ minPriority: "info" }))).toBe(true);
    expect(shouldDeliver(alert({ priority: "warning" }), prefs({ minPriority: "critical" }))).toBe(
      false,
    );
  });

  it("refuses to send with no destination, even on an on channel", () => {
    expect(shouldDeliver(alert(), { channel: "email", minPriority: "info" })).toBe(false);
  });
});

describe("the wire parsers", () => {
  it("accept only the channels and rungs we offer, so a stray body is never a wrong setting", () => {
    expect(parseChannel("email")).toBe("email");
    expect(parseChannel("sms")).toBeUndefined();
    expect(parseChannel(7)).toBeUndefined();
    expect(parsePriority("critical")).toBe("critical");
    expect(parsePriority("loud")).toBeUndefined();
  });
});

describe("deliveryMessage", () => {
  it("repeats the producer's own words, names the loudness, and adds no number of its own", () => {
    const message = deliveryMessage(alert({ body: "Close or roll it." }), "ann@x.com");
    expect(message.to).toBe("ann@x.com");
    expect(message.subject).toBe(
      "[Act now] NVDA — NVDA 180 call is in the money — assignment risk",
    );
    expect(message.text).toContain("NVDA 180 call is in the money — assignment risk");
    expect(message.text).toContain("Close or roll it.");
    expect(message.text).toContain("paper trading, educational");
    expect(message.text).toContain("Turn delivery off any time");
    // No digits beyond the ones the producer's own title carried.
    expect(message.text).not.toContain("$");
  });

  it("says which producer it came from, so a member knows why they got it", () => {
    expect(deliveryMessage(alert({ source: "order-watch" }), "ann@x.com").text).toContain(
      "your own orders",
    );
    expect(deliveryMessage(alert(), "ann@x.com").text).toContain("your own option positions");
  });

  it("leaves the symbol out of the subject when the alert is not about one", () => {
    const message = deliveryMessage(
      alert({ symbol: undefined, priority: "info", title: "Something ambient" }),
      "ann@x.com",
    );
    expect(message.subject).toBe("[FYI] Something ambient");
  });
});

describe("deliveryFingerprint", () => {
  it("is the substrate's dismissal identity, so a re-derived alert is not mailed twice", () => {
    expect(deliveryFingerprint(alert({ id: "fresh-id", at: 9_999 }))).toBe(
      deliveryFingerprint(alert()),
    );
  });

  it("changes when the same condition escalates, so an escalation earns a second send", () => {
    expect(deliveryFingerprint(alert({ priority: "warning" }))).not.toBe(
      deliveryFingerprint(alert({ priority: "critical" })),
    );
  });
});
