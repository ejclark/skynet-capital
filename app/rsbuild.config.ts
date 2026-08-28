import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/rspack";

/**
 * The React shell's build (issue #738 phase 0) — Rsbuild over Rspack, per Eric's bundler call.
 *
 * The app grows BESIDE the node observatory server: in dev, everything the shell doesn't own is
 * proxied to it (auth, the SSE patch stream, the JSON board snapshot), so the same session cookie
 * gates both worlds and the shell never re-implements a server concern. The TanStack Router plugin
 * registers at the RSPACK level (`tools.rspack.plugins`), not Rsbuild's own plugin list — that is
 * where unplugin-based plugins live (TanStack's with-rspack guide).
 */

const SERVER = process.env.SKYNET_SERVER_ORIGIN ?? "http://localhost:8787";

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: { index: "./src/main.tsx" },
  },
  tools: {
    rspack: {
      plugins: [tanstackRouter({ target: "react", autoCodeSplitting: true })],
    },
  },
  html: {
    title: "Skynet Capital — Observatory",
  },
  server: {
    port: 5174,
    proxy: {
      "/api": SERVER,
      "/events": SERVER,
      "/board": SERVER,
      "/login": SERVER,
      "/auth": SERVER,
      "/logout": SERVER,
      "/pulse": SERVER,
    },
  },
});
