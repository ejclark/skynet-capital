// A member's own R&D records in a world (#8005, R&D: `docs/IA.md` §5.4) — the views they stated
// and the playbooks they drafted, kept in production's own stores and written through production's
// own handlers, so what R&D shows is the code's record of what the member typed, never a payload
// typed into a fixture.
//
// Production wires these stores on every boot (`serve-dashboard.ts` → `setupAccess`). A world names
// the ones it uses (`stores` in its input); each is the real class over a file in a scratch folder
// this compose owns, so two worlds never share one. A world that names none composes exactly as
// before: unwired, these reads answer an empty list, as an empty store would.
//
// THE MEMBER'S HISTORY (`writes` in the input): each entry is one POST a member made before the
// instant — `{ member, at, path, body }`, the body as the page sends it — replayed in order through
// `serverWrite` (../server-reads.mjs) with the process clock at that write's own time, so a view's
// stated day and a draft's saved time are the store's own stamps. Any write the handler does not
// answer `ok` stops the compose with the handler's words: a world never holds a record production
// would have refused.

import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** Each store a world may name: its production class (the pin may predate it) and file name. */
const STORES = {
  memberConvictions: {
    load: () => import("../../../src/server/member-conviction-store.ts"),
    name: "MemberConvictionStore",
    file: "member-convictions.json",
  },
  authoredPlays: {
    load: () => import("../../../src/server/authored-play-store.ts"),
    name: "AuthoredPlayStore",
    file: "authored-plays.json",
  },
};

/** The stores a world names, as config fields, each on its own scratch file. */
export async function memberStores(names = []) {
  if (names.length === 0) return {};
  const dir = mkdtempSync(join(tmpdir(), "study-member-stores-"));
  const out = {};
  for (const key of names) {
    const store = STORES[key];
    if (!store) throw new Error(`study world: no member store ${key}`);
    const Store = (await store.load())[store.name];
    if (typeof Store !== "function") {
      throw new Error(`study world: this commit has no ${store.name} — the world needs one`);
    }
    out[key] = new Store(join(dir, store.file));
  }
  return out;
}

/** Run `fn` with `new Date()` and `Date.now()` answering `iso`, then restore the pinned clock. A
 *  handler that reads the config's clock instead (`config.now`) is handed the same time by
 *  `replayWrites`. */
async function atTime(iso, fn) {
  const Pinned = globalThis.Date;
  const at = Pinned.parse(iso);
  class At extends Pinned {
    constructor(...args) {
      if (args.length === 0) super(at);
      else super(...args);
    }
    static now() {
      return at;
    }
  }
  globalThis.Date = At;
  try {
    return await fn();
  } finally {
    globalThis.Date = Pinned;
  }
}

/** Replay a world's member history through the real handlers; throws on the first refusal. */
export async function replayWrites(writes, { config, channel, sessionFor, serverWrite }) {
  for (const w of writes) {
    const then = { ...config, now: () => new Date(w.at) };
    const answer = await atTime(w.at, () =>
      serverWrite(w.path, w.body, then, channel, sessionFor(w.member)),
    );
    const body = /** @type {any} */ (answer?.body);
    if (answer?.status !== 200 || body?.ok !== true) {
      throw new Error(
        `compose: ${w.member}'s ${w.path} at ${w.at} was not saved: ${JSON.stringify(answer)}`,
      );
    }
  }
}
