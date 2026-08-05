#!/usr/bin/env node
// Interactive local dev loop for the /tower Babylon scene — the fast alternative to a PR + verify +
// deploy cycle for iterating on 3D work. Rebuilds public/three/scene.js automatically on save (esbuild
// --watch) and serves ./public statically, so the loop is: edit a piece/shader → save → refresh the
// browser tab. No server process, no credentials, no deploy.
//
//   npm run dev:tower [--port 8931]
//
// Ctrl+C stops both the watcher and the static server.

import { spawn } from "node:child_process";
import { copyFileSync } from "node:fs";

const arg = (flag, fallback) => {
  const i = process.argv.indexOf(flag);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const PORT = arg("--port", "8931");

// Stage the real shell into the static root so this serves exactly what /tower serves in prod.
copyFileSync("src/three/scene.html", "public/tower.html");

const children = [];
function spawnTracked(cmd, args, opts) {
  const child = spawn(cmd, args, opts);
  children.push(child);
  return child;
}

console.log("→ watching src/three/** — scene.js rebuilds on save\n");
spawnTracked(
  "npx",
  [
    "esbuild",
    "src/three/scene-main.ts",
    "--bundle",
    "--format=iife",
    "--target=es2020",
    "--outfile=public/three/scene.js",
    // Plain --watch exits the moment stdin isn't an attached TTY (backgrounded shells, some
    // terminal multiplexers) — "forever" is what keeps it alive as a real long-running dev process.
    "--watch=forever",
  ],
  { stdio: "inherit" },
);

spawnTracked("python3", ["-m", "http.server", PORT, "--bind", "127.0.0.1"], {
  cwd: "public",
  stdio: "ignore",
});

setTimeout(() => {
  console.log(`\n  ▸ http://127.0.0.1:${PORT}/tower.html`);
  console.log(`  ▸ http://127.0.0.1:${PORT}/tower.html?power=0.62&health=0.15  (preview dials)\n`);
  console.log("  Drag to orbit, scroll to zoom — check every angle, not just the front.");
  console.log("  Ctrl+C to stop.\n");
}, 600);

function shutdown() {
  for (const child of children) child.kill();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
