# ADR-0001: Host the live dashboard as an always-on Fly.io service

- **Status:** Accepted
- **Date:** 2026-07-25

## Context

The dashboard is a long-running Node HTTP + Server-Sent-Events server: it holds open SSE
connections to browsers and websockets to Alpaca, and pushes updates the instant state changes.
It must therefore run continuously, and be reachable by a group of family/friends without anyone
babysitting a laptop.

## Decision

We will deploy the dashboard as an always-on container on **Fly.io**, configured in `fly.toml`
(`min_machines_running = 1`, `auto_stop_machines = false`, region `ord` near Iowa). The image is
a host-agnostic `Dockerfile`, so the same artifact runs elsewhere if needed.

## Alternatives considered

- **Claude Artifact / static hosting** — no server process and a strict CSP block external hosts;
  cannot hold SSE or stream live data. Rejected.
- **Tunnel from a local machine (cloudflared/ngrok)** — ties uptime to a laptop staying awake;
  fine for a quick demo, not for a launched group. Kept only as a stopgap.
- **Render / Railway** — viable on the same Docker image; Fly chosen for cost (~$2–5/mo) and an
  Iowa-adjacent region. The image stays portable so this can change.

## Consequences

- A public HTTPS URL with no laptop dependency; `PORT` is honored so other PaaS hosts work too.
- Introduces a Fly account and its secrets/volumes as operational surface (see ADR-0003, ADR-0004).
- App names are globally unique on Fly — the intended name was taken, so the app is `skynet-capital`;
  keeping `fly.toml`'s `app` aligned with the real app is a required, easy-to-miss step.
