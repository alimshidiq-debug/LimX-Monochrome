# LimX Monochrome — BitChord Add-on

A custom, LimX-branded BitChord source provider adapted from the MIT-licensed `bitchord-monochrome-addon` project. It uses the Monochrome API network for music search and stream resolution.

> **Upstream attribution:** Original project: https://github.com/acedreamer/bitchord-monochrome-addon. Original MIT license is retained in `LICENSE`. LimX branding and modifications are layered on top; this is not an official Monochrome or BitChord project.

## Features

- BitChord add-on protocol endpoints: `GET /manifest.json`, `GET /search`, and `GET /stream/:id`.
- Monochrome modern search with HiFi instance-pool fallback.
- FLAC / Lossless and Hi-Res quality options; configurable default quality.
- Instance pool failover and preview-token detection/blacklisting.
- DASH-to-Lossless fallback for direct FLAC compatibility where supported upstream.
- In-memory search cache.
- Health endpoint at `GET /health` for deployment monitoring.
- Docker support and cloud deployment templates.

## Quick start

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

The server listens on `http://localhost:8080` by default. Add this URL as a custom provider in BitChord. For a phone, use the computer's LAN IP and ensure both devices are on the same network.

Production build:

```bash
npm run build
npm start
```

## Settings / environment

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `8080` | HTTP port |
| `HOST` | `0.0.0.0` | Bind interface |
| `DEFAULT_AUDIO_QUALITY` | `LOSSLESS` | `HI_RES_LOSSLESS`, `LOSSLESS`, or `HIGH` |
| `HIFI_API_INSTANCES` | Built-in pool | Comma-separated API nodes; valid HTTP(S) URLs only |

## Endpoints

- `GET /manifest.json` — BitChord manifest and quality setting.
- `GET /search?q=<query>` — Search tracks. Empty queries return HTTP 400.
- `GET /stream/:id?quality=<quality>` — Resolve a track stream. Invalid quality values fall back to `LOSSLESS`.
- `GET /health` — Returns `{ "status": "ok", "service": "LimX Monochrome" }`.

## Docker

```bash
docker compose up --build -d
```

Provider URL: `http://<host>:8080`

## Tests and build

```bash
npm test
npm run typecheck
npm run build
```

`npm run test:live` performs live upstream checks and may fail if community upstream nodes are offline or unavailable.

## Disclaimer

LimX Monochrome is an independent community modification. Availability, stream formats, and quality depend on upstream Monochrome/community APIs and source catalogs. Use only in accordance with upstream terms and applicable law.
