// The docker half of the stability budget run (#4612 slice 1, #4613): a private network, the stub
// broker, and the server container shaped like production's machine. Files reach containers by
// `docker cp` tar streams, never bind mounts — a docker host (Colima, a CI runner) may not share
// the directory a worktree lives in, and a bind mount there silently shows an empty folder.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";

export const docker = (...args) => execFileSync("docker", args, { encoding: "utf8" }).trim();
const quiet = (...args) => spawnSync("docker", args, { stdio: "ignore" });

export const dockerReachable = () => quiet("version").status === 0;

export const containerNames = (prefix) => ({
  net: `${prefix}net`,
  broker: `${prefix}broker`,
  server: `${prefix}server`,
});

/** Where the server reaches the stub broker, by container name on the private network. */
export const brokerUrl = (names) => `http://${names.broker}:8080`;

export function removeContainers(names) {
  quiet("rm", "-f", names.server, names.broker);
  quiet("network", "rm", names.net);
}

/** Stream `paths` (relative to `from`; "" = all of it) into a stopped container as `/<base>/…`. */
function copyInto(container, from, paths, excludes = []) {
  const base = basename(from);
  const tar = spawnSync(
    "tar",
    [
      "-C",
      dirname(from),
      "--no-xattrs",
      "-cf",
      "-",
      ...excludes.flatMap((x) => ["--exclude", `${base}/${x}`]),
      ...paths.map((p) => (p ? `${base}/${p}` : base)),
    ],
    { env: { ...process.env, COPYFILE_DISABLE: "1" }, maxBuffer: 1 << 30 },
  );
  if (tar.status !== 0) throw new Error(`tar failed: ${tar.stderr}`);
  const cp = spawnSync("docker", ["cp", "-", `${container}:/`], { input: tar.stdout });
  if (cp.status !== 0) throw new Error(`docker cp failed: ${cp.stderr}`);
}

/**
 * What the image carries at runtime: the Dockerfile's `COPY . .` minus .dockerignore (docs/ ships
 * only the research shelf) and dev-only weight. The bundle's one external import, `marked`, is
 * copied on its own instead of 500 MB of node_modules.
 */
function copyRuntimeTree(container, root) {
  const docs = existsSync(join(root, "docs"))
    ? readdirSync(join(root, "docs"))
        .filter((n) => n !== "research")
        .map((n) => `docs/${n}`)
    : [];
  const dev = [".git", "node_modules", "app/node_modules", "data", "coverage", "tests", "e2e"];
  copyInto(container, root, [""], [...dev, "spikes", ".claude", ".github", ...docs]);
  copyInto(container, root, ["node_modules/marked"]);
}

/**
 * Start the stub broker (`stubDir` holds stub-broker.mjs + accounts.json), then the server: plain
 * node on `root`'s bundle at /app, `dataDir` at /data, a hard `memory` limit with no swap.
 */
export function startContainers({
  names,
  image,
  memory,
  port,
  root,
  stubDir,
  dataDir,
  env,
  command,
}) {
  docker("network", "create", names.net);
  docker(
    "create",
    "--name",
    names.broker,
    "--network",
    names.net,
    "--memory",
    "128m",
    image,
    "node",
    "/stub/stub-broker.mjs",
    "/stub/accounts.json",
    "8080",
  );
  docker("cp", `${stubDir}/.`, `${names.broker}:/stub`);
  docker("start", names.broker);
  docker(
    "create",
    "--name",
    names.server,
    "--network",
    names.net,
    `--memory=${memory}`,
    `--memory-swap=${memory}`,
    "-p",
    `127.0.0.1:${port}:8787`,
    ...Object.entries(env).flatMap(([k, v]) => ["-e", `${k}=${v}`]),
    image,
    "sh",
    "-c",
    `[ -d /app ] || mv /${basename(root)} /app; cd /app && exec ${command}`,
  );
  copyRuntimeTree(names.server, root);
  docker("cp", `${dataDir}/.`, `${names.server}:/data`);
  docker("start", names.server);
}

/**
 * Read the server container from outside: its state, node's resident memory (PID 1 — `exec` makes
 * node the container's init), a reset of that high-water mark, and the cgroup's own peak.
 */
export function serverProbe(server) {
  const state = () => {
    const [running, oom, exit] = docker(
      "inspect",
      "-f",
      "{{.State.Running}} {{.State.OOMKilled}} {{.State.ExitCode}}",
      server,
    ).split(" ");
    return { running: running === "true", oomKilled: oom === "true", exitCode: Number(exit) };
  };
  return {
    state,
    status: () => docker("exec", server, "cat", "/proc/1/status"),
    resetPeak: () => docker("exec", server, "sh", "-c", "echo 5 > /proc/1/clear_refs"),
    cgroupPeakMb: () =>
      Math.round(Number(docker("exec", server, "cat", "/sys/fs/cgroup/memory.peak")) / 1048576),
    logs: () => {
      const out = spawnSync("docker", ["logs", server], { encoding: "utf8" });
      return `${out.stdout}${out.stderr}`;
    },
    /** True once the server logs that it is serving; false if it died or `timeoutMs` passed. */
    async ready(timeoutMs = 120_000) {
      for (const until = Date.now() + timeoutMs; Date.now() < until; ) {
        await new Promise((r) => setTimeout(r, 250));
        if (!state().running) return false;
        if (docker("logs", server).includes("Observatory live")) return true;
      }
      return false;
    },
  };
}
