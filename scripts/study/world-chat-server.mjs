// MONEYPENNY'S SIDE OF A STUDY WORLD (#8005 slice 4) — one child process per member session that
// answers the dock's chat with PRODUCTION's own route (`serveCompanionApi`) and engine
// (`createCompanionChat`) over the world's book. Started and spoken to by world-chat.mjs; never run
// by hand except to prove it (world-chat.mjs --probe).
//
//   node --import tsx scripts/study/world-chat-server.mjs --run <compose dir> --world <name> \
//     --record <dir> [--stub <dir> | --off]   # prints one line {"ready": <port>} on stdout
//
// `--off` leaves the companion unwired: production's route then answers "isn't switched on yet".
//
// WHY A CHILD: the chat's route and tools read the clock (the member context's "now", whether the
// market is open, the calendar's fortnight), so they must run on the world's pinned instant — and a
// process that drives a browser must never pin its own clock (instant.mjs). So this process pins
// the clock, refuses the network (no-network.mjs: nothing here may fetch), stands in the world's
// pinned corpus like the composer's children, and builds the same server config the composer
// does (server-config.mjs). The seams production wires around the chat come from that config —
// the member's onboarding, filings, convictions, the follow-up hook — and the desk tools from the
// book (`worldChatTools`). The model is chat-transport.mjs's sealed call; nothing else differs.
//
// WHAT A WORLD'S MONEYPENNY CANNOT DO, said rather than faked: the lookups production fills from
// GitHub or the volume (work status, the roadmap, similar filings, what members ask, research
// questions, sized suggestions, ranked structures) are left unwired, so each answers "not
// available" as production does without them. Declared in worlds/shell-artifacts.mjs.

process.env.TZ = "UTC";

import { existsSync, mkdtempSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { makeTransport, toolCatchingCall } from "./chat-transport.mjs";
import { guardNetwork } from "./no-network.mjs";
import { makeCaller } from "./sealed.mjs";
import { VIEWER_HEADER } from "./world-chat.mjs";
import { loadInput, worldNetwork } from "./worlds/inputs.mjs";
import { pinProcessClock } from "./worlds/instant.mjs";

function args(argv) {
  const get = (flag) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const opts = {
    run: get("--run"),
    world: get("--world"),
    record: get("--record"),
    stub: get("--stub"),
    off: argv.includes("--off"),
  };
  const missing = ["run", "world", "record"].filter((k) => !opts[k]);
  if (missing.length > 0) throw new Error(`world-chat-server: missing --${missing.join(", --")}`);
  return { ...opts, run: resolve(opts.run), record: resolve(opts.record) };
}

/**
 * The desk tools production builds in `setupCompanion` (src/scripts/dashboard-companion.ts),
 * from the world's book: the member's own positions and fills, the ladder, and the calendar of
 * events (the world's pinned corpus is the working directory, so the calendar is the instant's).
 */
async function worldChatTools(book, config) {
  const { upcomingEvents } = await import("../../src/server/upcoming-events.ts");
  const { marketDayKey } = await import("../../src/domain/market-day.ts");
  return {
    snapshotFor: (id) => book.participants.find((p) => p.id === id),
    readTradeActivity: config.readTradeActivity,
    ...(config.progression ? { progression: config.progression } : {}),
    readUpcomingEvents: (held, underlying) =>
      upcomingEvents({
        asOf: marketDayKey(new Date().toISOString()),
        held,
        ...(underlying ? { underlying } : {}),
      }),
  };
}

async function main() {
  const opts = args(process.argv.slice(2));
  pinProcessClock();
  const { WORLDS } = await import("./worlds/index.mjs");
  const world = WORLDS.find((w) => w.name === opts.world);
  if (!world) throw new Error(`world-chat-server: no world named ${opts.world}`);
  const input = loadInput(world.input);
  guardNetwork(worldNetwork(input));
  // The composer left the world's corpus in the run; reading it here keeps the chat's facts the
  // instant's, never the tree's.
  const corpus = join(opts.run, ".corpus", String(input.corpus?.commit ?? "").slice(0, 12));
  if (!existsSync(join(corpus, "package.json"))) {
    throw new Error(`world-chat-server: no corpus at ${corpus} — compose the run first`);
  }
  process.chdir(corpus);
  process.env.SKYNET_RESEARCH_DIR = join(corpus, "docs", "research");
  const { buildBook } = await import("./worlds/book.mjs");
  const { serverConfig, sessionFor } = await import("./worlds/server-config.mjs");
  const { createCompanionChat } = await import("../../src/companion/companion-chat.ts");
  const { serveCompanionApi } = await import("../../src/server/companion-routes.ts");
  const book = buildBook(world.input);
  const base = serverConfig(book);
  const { doFetch, doStream } = makeTransport({
    call: makeCaller({
      stub: opts.stub && resolve(opts.stub),
      record: opts.record,
      exec: toolCatchingCall,
    }),
    dir: mkdtempSync(join(tmpdir(), "study-moneypenny-")),
  });
  const tools = await worldChatTools(book, base);
  const config = opts.off
    ? base
    : {
        ...base,
        companion: createCompanionChat({ apiKey: "study-world", tools }, doFetch, doStream),
      };
  const server = createServer(async (req, res) => {
    const path = new URL(req.url ?? "/", "http://127.0.0.1").pathname;
    const email = world.viewers[String(req.headers[VIEWER_HEADER] ?? "")];
    const handled = email
      ? await serveCompanionApi(req, res, path, config, sessionFor(email))
      : false;
    if (!handled) {
      res.writeHead(404, { "content-type": "application/json" });
      res.end(
        JSON.stringify({ error: email ? "not a chat route" : "no such viewer in this world" }),
      );
    }
  });
  server.listen(0, "127.0.0.1", () => {
    process.stdout.write(`${JSON.stringify({ ready: server.address().port })}\n`);
  });
}

main().catch((e) => {
  process.stderr.write(`${e instanceof Error ? e.stack : e}\n`);
  process.exit(1);
});
