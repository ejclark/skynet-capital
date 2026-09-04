import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createActivityEventBus,
  createBootActivityEventBus,
  JsonlActivityEventBus,
} from "../../src/observatory/activity-bus.js";
import { type ActivityEvent, forVisibility } from "../../src/observatory/activity-event.js";
import { InMemoryActivityEventBus } from "../../src/observatory/in-memory-activity-event-bus.js";

const event = (overrides: Partial<ActivityEvent> = {}): ActivityEvent => ({
  id: "ord-1:order.filled:2026-08-19T14:30:00.000Z:10",
  eventType: "order.filled",
  actor: { participantId: "sauron" },
  target: { kind: "order", id: "ord-1" },
  at: "2026-08-19T14:30:00.000Z",
  correlationId: "ord-1",
  source: "stream",
  outcome: "success",
  visibility: "public",
  payload: {},
  ...overrides,
});

describe("InMemoryActivityEventBus", () => {
  it("records events and lists by participant", async () => {
    const bus = new InMemoryActivityEventBus();
    await bus.publish(event({ actor: { participantId: "sauron" } }));
    await bus.publish(event({ id: "ord-2", actor: { participantId: "human-eric" } }));

    expect(await bus.list()).toHaveLength(2);
    expect(await bus.list("sauron")).toHaveLength(1);
  });

  it("fans out published events to live subscribers", async () => {
    const bus = new InMemoryActivityEventBus();
    const received: ActivityEvent[] = [];
    const sub = bus.subscribe((e) => received.push(e));

    await bus.publish(event());
    sub.unsubscribe();
    await bus.publish(event({ id: "ord-2" }));

    expect(received).toHaveLength(1);
    expect(received[0]?.id).toBe(event().id);
  });
});

describe("JsonlActivityEventBus", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-activity-bus-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("persists across instances (durable, not just in-process)", async () => {
    const first = new JsonlActivityEventBus(dir);
    await first.publish(event());

    const second = new JsonlActivityEventBus(dir);
    expect(await second.list("sauron")).toHaveLength(1);
  });

  it("returns nothing for an unknown participant (missing file, not an error)", async () => {
    const bus = new JsonlActivityEventBus(dir);
    expect(await bus.list("nobody")).toEqual([]);
  });
});

describe("createActivityEventBus", () => {
  it("nests under SKYNET_ACTIVITY_DIR rather than its own env var — no fly.toml entry needed", async () => {
    const activityDir = await mkdtemp(join(tmpdir(), "skynet-activity-"));
    try {
      const bus = createActivityEventBus({ SKYNET_ACTIVITY_DIR: activityDir } as NodeJS.ProcessEnv);
      await bus.publish(event());
      const second = new JsonlActivityEventBus(join(activityDir, "events"));
      expect(await second.list("sauron")).toHaveLength(1);
    } finally {
      await rm(activityDir, { recursive: true, force: true });
    }
  });
});

describe("createBootActivityEventBus", () => {
  it("gives offline mode an in-memory bus, so a fixture replay never compounds on disk", () => {
    expect(createBootActivityEventBus({} as NodeJS.ProcessEnv, "offline")).toBeInstanceOf(
      InMemoryActivityEventBus,
    );
  });
});

describe("forVisibility", () => {
  it("keeps only events in the allowed tiers", () => {
    const isOwnerOrPublic = forVisibility(["owner-only", "public"]);
    expect(isOwnerOrPublic(event({ visibility: "public" }))).toBe(true);
    expect(isOwnerOrPublic(event({ visibility: "owner-only" }))).toBe(true);
    expect(isOwnerOrPublic(event({ visibility: "admin-only" }))).toBe(false);
  });
});
