# Live observatory server — runs the SSE dashboard + Alpaca streams.
#
# Three targets from one build (slice 9 of #4612 — the image carries runtime dependencies only):
#
#   docker build --target dashboard .   the slim image for ANY host: plain node, `marked` + `three`
#                                       and the built bundles. No dev tooling, no tsx. Boots with
#                                       `node dist/serve.mjs` (see docs/DEPLOY.md → "any container host").
#   docker build .                      the LAST stage, `bots`: the dashboard image plus the tsx
#                                       closure, because the bots app (fly.bots.toml) runs
#                                       `tsx src/scripts/run-autonomous.ts` from the same image — the
#                                       deploy job builds one image per push and rolls both Fly apps
#                                       onto it (pipeline.yml `deploy-bots` reuses it). It stays last on
#                                       purpose: a bare `docker build` / `fly deploy` takes the last stage.
#
# Why two node_modules trees: the server's bare imports are `marked` and `three` and nothing else
# (esbuild bundles our own code; `--packages=external` leaves only those two to resolve), so a
# production install is a few MB where the full dev install is ~800 MB (playwright, knip, jsdom,
# mermaid, semantic-release…). The build still needs the dev tree, so it keeps its own.

# --- deps-full: every dependency, for building --------------------------------------------------
FROM node:24-slim AS deps-full
WORKDIR /app
# --no-audit: npm ci's default vulnerability-audit network call dominates its wall-clock (measured
# 2026-09-04, docs/LESSONS.md: 112s of a 114s CI install was this one call) — skip it in a build.
COPY package.json package-lock.json ./
RUN npm ci --no-audit

# --- deps-prod: what the dashboard needs at runtime ---------------------------------------------
FROM node:24-slim AS deps-prod
WORKDIR /app
COPY package.json package-lock.json ./
# --ignore-scripts: `prepare` runs husky, a dev dependency this install deliberately omits.
RUN npm ci --omit=dev --ignore-scripts --no-audit

# --- build: scene bundle, server bundle, React shell --------------------------------------------
FROM deps-full AS build
COPY . .

# Build the Babylon scene bundle. This MUST come after `COPY . .` — it needs src/three/**, which
# doesn't exist during the earlier `npm ci` layer. (Putting it in package.json's `prepare` broke the
# image build for exactly that reason.)
RUN npm run build:scene

# Bundle the dashboard server (esbuild → dist/serve.mjs) so production runs plain node: one process
# instead of npm → tsx launcher → node+loader, ~86 MB RSS at boot instead of ~295 MB. The 512 MB
# machine was OOM-killed at 364 MB on 2026-10-01 (#4425). Deps stay external, resolved from
# node_modules at runtime.
RUN npm run build:server

# Build the React shell (#738) — its own dependency tree, then rsbuild → app/dist, which the
# server serves behind the gate at /app (src/server/app-shell-routes.ts). The node_modules used
# only for this build are pruned so the image carries the static dist and nothing else.
RUN cd app && npm ci --no-audit && npm run build && rm -rf node_modules

# The repo tree (docs/research, src/domain/market-events, src/three/scene.html, package.json… — the
# server reads these off its working directory at runtime) goes to the runtime stages WITHOUT the
# dev tree; they bring their own node_modules.
RUN rm -rf node_modules

# --- dashboard: the slim runtime ----------------------------------------------------------------
FROM node:24-slim AS dashboard
WORKDIR /app
COPY --from=build /app ./
COPY --from=deps-prod /app/node_modules ./node_modules

# Default port; hosting platforms that inject PORT override it via resolvePort().
EXPOSE 8787

CMD ["node", "--enable-source-maps", "dist/serve.mjs"]

# --- bots: dashboard + tsx, the image both Fly apps run -----------------------------------------
# tsx and its one dependency (esbuild, with the platform binary npm installed) copied from the full
# tree — lockfile-pinned, not a second resolution. `.bin/tsx` is the symlink `npm run` resolves; COPY
# would flatten it into a file whose relative imports then miss (proven by the boot test), so it is
# relinked instead.
FROM dashboard AS bots
COPY --from=deps-full /app/node_modules/tsx ./node_modules/tsx
COPY --from=deps-full /app/node_modules/esbuild ./node_modules/esbuild
COPY --from=deps-full /app/node_modules/@esbuild ./node_modules/@esbuild
RUN ln -s ../tsx/dist/cli.mjs node_modules/.bin/tsx
