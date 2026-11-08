import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  publishingActivityStore,
  publishingFeedbackLogStore,
  publishingLadderProgressLog,
  publishingOrderAuditLog,
} from "../../src/observatory/activity-publishing.js";
import { createActivityStore } from "../../src/observatory/activity-store.js";
import { InMemoryActivityEventBus } from "../../src/observatory/in-memory-activity-event-bus.js";
import { createFeedbackLogStore } from "../../src/server/feedback-log.js";
import { createLadderProgressLogStore } from "../../src/server/ladder-progress-log.js";
import { createOrderAuditLog } from "../../src/server/order-audit-log.js";

/**
 * The class behind #6597 (#4612 slice 10's third lesson): a decorator that rebuilds a store as an
 * object literal forwards only the methods someone remembered. `publishingOrderAuditLog` dropped
 * the optional `since`, so the held folds behind it fell back to whole reads in production while
 * every spec, built on the bare log, stayed green. One wrapper's own spec guards that one method;
 * this one guards the class: each publishing decorator, over the store production actually builds,
 * offers every method that store offers — so a `since` added to a store tomorrow fails here until
 * its wrapper forwards it, instead of quietly costing a whole read per request.
 */

const root = mkdtempSync(join(tmpdir(), "publishing-forwarding-"));
const env = {
  SKYNET_ACTIVITY_DIR: join(root, "activity"),
  SKYNET_ORDER_AUDIT_DIR: join(root, "order-audit"),
  SKYNET_FEEDBACK_LOG_DIR: join(root, "feedback-log"),
  SKYNET_LADDER_PROGRESS_DIR: join(root, "ladder-progress"),
};

afterAll(() => rmSync(root, { recursive: true, force: true }));

/** The methods a class instance offers — its prototype chain up to `Object`. */
function methodsOf(store: object): string[] {
  const names = new Set<string>();
  for (let proto = Object.getPrototypeOf(store); proto && proto !== Object.prototype; ) {
    for (const name of Object.getOwnPropertyNames(proto)) {
      if (name !== "constructor" && typeof Reflect.get(store, name) === "function") names.add(name);
    }
    proto = Object.getPrototypeOf(proto);
  }
  return [...names].sort();
}

/** The methods a wrapper offers — its own keys, since every decorator here is an object literal. */
function offeredBy(wrapped: object): string[] {
  return Object.keys(wrapped)
    .filter((name) => typeof Reflect.get(wrapped, name) === "function")
    .sort();
}

type Wrap = (inner: never, bus: InMemoryActivityEventBus) => object;

const cases: ReadonlyArray<{ name: string; inner: () => object; wrap: Wrap }> = [
  {
    name: "publishingActivityStore",
    inner: () => createActivityStore(env),
    wrap: publishingActivityStore,
  },
  {
    name: "publishingOrderAuditLog",
    inner: () => createOrderAuditLog(env),
    wrap: publishingOrderAuditLog,
  },
  {
    name: "publishingFeedbackLogStore",
    inner: () => createFeedbackLogStore(env),
    wrap: publishingFeedbackLogStore,
  },
  {
    name: "publishingLadderProgressLog",
    inner: () => createLadderProgressLogStore(env),
    wrap: publishingLadderProgressLog,
  },
];

describe("when a publishing decorator wraps the store production builds", () => {
  for (const { name, inner, wrap } of cases) {
    it(`${name} offers every method that store offers`, () => {
      const store = inner();
      const wrapped = wrap(store as never, new InMemoryActivityEventBus());

      expect(offeredBy(wrapped)).toEqual(expect.arrayContaining(methodsOf(store)));
    });
  }

  it("reads at least record, list and since off the file-backed order audit (the check sees methods)", () => {
    expect(methodsOf(createOrderAuditLog(env))).toEqual(
      expect.arrayContaining(["list", "record", "since"]),
    );
  });
});
