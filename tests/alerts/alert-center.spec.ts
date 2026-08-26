import { InMemoryAlertDismissals } from "../../src/adapters/in-memory-alert-dismissals.js";
import type { Alert } from "../../src/alerts/alert.js";
import { AlertBus } from "../../src/alerts/alert-bus.js";
import { AlertCenter } from "../../src/alerts/alert-center.js";
import type { AlertDismissalsPort } from "../../src/ports/alert-dismissals.js";

const alert = (over: Partial<Alert> = {}): Alert => ({
  id: "a1",
  at: 1_000,
  source: "price",
  priority: "warning",
  title: "NVDA through its stop",
  symbol: "NVDA",
  ...over,
});

const openCenter = (bus: AlertBus, dismissals: AlertDismissalsPort, consumerId = "eric") =>
  AlertCenter.open({ bus, dismissals, consumerId });

describe("AlertCenter", () => {
  it("shows the matching window when nothing has been dismissed", async () => {
    const bus = new AlertBus();
    bus.publish(alert({ id: "cal", source: "calendar" }));
    bus.publish(alert({ id: "price", source: "price" }));
    const center = await openCenter(bus, new InMemoryAlertDismissals());
    expect(center.visible({ sources: ["calendar"] }).map((a) => a.id)).toEqual(["cal"]);
  });

  it("hides an alert once it is dismissed", async () => {
    const bus = new AlertBus();
    const subject = alert({ id: "stop" });
    bus.publish(subject);
    const center = await openCenter(bus, new InMemoryAlertDismissals());
    expect(center.isDismissed(subject)).toBe(false);
    await center.dismiss(subject);
    expect(center.isDismissed(subject)).toBe(true);
    expect(center.visible()).toEqual([]);
  });

  it("keeps the alert dismissed on the next load — the whole point of the port", async () => {
    const dismissals = new InMemoryAlertDismissals();
    const subject = alert({ id: "stop", dedupeKey: "nvda-stop" });
    const first = await openCenter(new AlertBus(), dismissals);
    await first.dismiss(subject);

    const reloadedBus = new AlertBus();
    reloadedBus.publish({ ...subject, id: "stop-reissued", at: 2_000 });
    const second = await openCenter(reloadedBus, dismissals);
    expect(second.visible()).toEqual([]);
  });

  it("does not carry one member's dismissal over to another", async () => {
    const dismissals = new InMemoryAlertDismissals();
    const subject = alert({ id: "stop" });
    const mine = await openCenter(new AlertBus(), dismissals, "eric");
    await mine.dismiss(subject);

    const bus = new AlertBus();
    bus.publish(subject);
    const theirs = await openCenter(bus, dismissals, "sauron");
    expect(theirs.visible().map((a) => a.id)).toEqual(["stop"]);
  });

  it("shows an escalated repeat again, because louder is genuinely new news", async () => {
    const dismissals = new InMemoryAlertDismissals();
    const quiet = alert({ id: "q", priority: "info", dedupeKey: "nvda-drawdown" });
    const first = await openCenter(new AlertBus(), dismissals);
    await first.dismiss(quiet);

    const bus = new AlertBus();
    bus.publish({ ...quiet, id: "loud", priority: "critical", at: 2_000 });
    const second = await openCenter(bus, dismissals);
    expect(second.visible().map((a) => a.id)).toEqual(["loud"]);
  });

  it("delivers live alerts to a watcher, filtered to its own interest", async () => {
    const bus = new AlertBus();
    const center = await openCenter(bus, new InMemoryAlertDismissals());
    const seen: string[] = [];
    center.watch({ symbols: ["NVDA"] }, (a) => seen.push(a.id));
    bus.publish(alert({ id: "nvda", symbol: "NVDA" }));
    bus.publish(alert({ id: "spy", symbol: "SPY" }));
    expect(seen).toEqual(["nvda"]);
  });

  it("stops re-nagging a watcher once the standing condition is dismissed", async () => {
    const bus = new AlertBus();
    const center = await openCenter(bus, new InMemoryAlertDismissals());
    const seen: string[] = [];
    center.watch({}, (a) => seen.push(a.id));
    const poll = alert({ id: "poll-1", dedupeKey: "nvda-stop" });
    bus.publish(poll);
    await center.dismiss(poll);
    bus.publish({ ...poll, id: "poll-2", at: 2_000 });
    expect(seen).toEqual(["poll-1"]);
  });

  it("stops delivering after the watch is released", async () => {
    const bus = new AlertBus();
    const center = await openCenter(bus, new InMemoryAlertDismissals());
    const seen: string[] = [];
    const off = center.watch({}, (a) => seen.push(a.id));
    bus.publish(alert({ id: "before" }));
    off();
    bus.publish(alert({ id: "after" }));
    expect(seen).toEqual(["before"]);
  });

  it("refuses to open when the dismissal store cannot be read", async () => {
    const broken: AlertDismissalsPort = {
      loadDismissed: () => Promise.reject(new Error("volume unavailable")),
      dismiss: () => Promise.resolve(),
    };
    await expect(openCenter(new AlertBus(), broken)).rejects.toThrow("volume unavailable");
  });

  it("leaves the alert visible when the dismissal write is rejected", async () => {
    const refusing: AlertDismissalsPort = {
      loadDismissed: () => Promise.resolve([]),
      dismiss: () => Promise.reject(new Error("volume read-only")),
    };
    const bus = new AlertBus();
    const subject = alert({ id: "stop" });
    bus.publish(subject);
    const center = await openCenter(bus, refusing);
    await expect(center.dismiss(subject)).rejects.toThrow("volume read-only");
    expect(center.visible().map((a) => a.id)).toEqual(["stop"]);
  });
});
