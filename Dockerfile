# Live observatory server — runs the SSE dashboard + Alpaca streams. The bots app (fly.bots.toml)
# runs this same image with its own process command: CI deploys it with the dashboard deploy's
# `--image`, so there is one image for both apps and it must serve both.
#
# Two stages (#4612 slice 9, #4621). `build` installs every dependency, because building needs the
# dev ones (esbuild, the React shell's toolchain). `runtime` carries the built tree with only
# production dependencies: since both processes run as esbuild bundles on plain node, nothing at
# runtime needs tsx, TypeScript, Playwright or the test tools, which were most of the image.

FROM node:24-slim AS build

WORKDIR /app

# Install deps first for layer caching.
# --no-audit: npm ci's default vulnerability-audit network call dominates its wall-clock (measured
# 2026-09-04, docs/LESSONS.md: 112s of a 114s CI install was this one call) — skip it in a build.
COPY package.json package-lock.json ./
RUN npm ci --no-audit

COPY . .

# Build the Babylon scene bundle. This MUST come after `COPY . .` — it needs src/three/**, which
# doesn't exist during the earlier `npm ci` layer. (Putting it in package.json's `prepare` broke the
# image build for exactly that reason.)
RUN npm run build:scene

# Bundle both processes (esbuild → dist/serve.mjs, dist/bots.mjs) so production runs plain node: one
# process instead of npm → tsx launcher → node+loader, ~86 MB RSS at boot instead of ~295 MB. The
# 512 MB machine was OOM-killed at 364 MB on 2026-10-01 (#4425). Deps stay external, resolved from
# node_modules at runtime.
RUN npm run build:server && npm run build:bots

# Build the React shell (#738) — its own dependency tree, then rsbuild → app/dist, which the
# server serves behind the gate at /app (src/server/app-shell-routes.ts). The node_modules used
# only for this build are pruned so the image carries the static dist and nothing else.
RUN cd app && npm ci --no-audit && npm run build && rm -rf node_modules

# Drop the dev dependencies now that every build step is done. `runtime` copies this tree whole,
# so files the server reads from the working directory at request time (the research shelf,
# public/, fixtures) are exactly where they were in the single-stage image.
RUN npm prune --omit=dev --no-audit

FROM node:24-slim AS runtime

WORKDIR /app
COPY --from=build /app /app

# Default port; hosting platforms that inject PORT override it via resolvePort().
EXPOSE 8787

CMD ["node", "--enable-source-maps", "dist/serve.mjs"]
