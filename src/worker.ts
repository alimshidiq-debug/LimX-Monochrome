const DEFAULT_INSTANCES = [
  "https://wolf.qqdl.site",
  "https://maus.qqdl.site",
  "https://vogel.qqdl.site",
  "https://hund.qqdl.site",
  "https://katze.qqdl.site",
  "https://tidal.kinoplus.online"
];
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36";
const HEADERS = { "User-Agent": UA, "x-client": "BiniLossless/v3.4", "Origin": "https://monochrome.st", "Referer": "https://monochrome.st/" };
const QUALITY = ["HI_RES_LOSSLESS", "LOSSLESS", "HIGH"];

function json(data: any, status: number = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*" } });
}
function track(item: any) {
  const artists = Array.isArray(item.artistNames) && item.artistNames.length ? item.artistNames.join(", ") : item.artist?.name || item.artists?.[0]?.name || "Unknown Artist";
  const d = Number(item.duration || 0);
  return {
    id: String(item.id || item.trackId || ""),
    title: item.title || "",
    artist: artists,
    album: item.album?.title || item.releaseTitle || "",
    duration: d > 1000 ? Math.round(d / 10) / 100 : d,
    artworkURL: item.artwork || (item.album?.cover ? String(item.album.cover).replace(/-/g, "/") : null),
    format: "flac",
    audioQuality: item.mediaMetadata?.tags?.includes("HIRES_LOSSLESS") ? "HI_RES_LOSSLESS" : "LOSSLESS",
    isrc: item.isrc || null
  };
}
async function upstream(url: string, timeout: number = 5000) {
  return fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(timeout) });
}
async function search(q: string) {
  const url = "https://tracks.monochrome.st/search?q=" + encodeURIComponent(q);
  const r = await upstream(url);
  if (!r.ok) return { tracks: [] };
  const data = await r.json();
  let items = Array.isArray(data?.tracks) ? data.tracks : [];
  const top = Array.isArray(data?.topResults) ? data.topResults.find((x: any) => x?.entityType === "track" || x?.trackId) : null;
  if (top && !items.some((x: any) => x.id === top.id)) items = [top, ...items];
  return { tracks: items.slice(0, 15).map(track) };
}
async function resolveStream(id: string, quality: string) {
  if (id.length >= 15 && /^\\d+$/.test(id)) {
    return { url: "https://tracks.monochrome.st/track/" + id, format: "flac", quality, mimeType: "audio/flac", manifest: "none", encrypted: false, sampleRate: 44100, bitDepth: 16, headers: { "User-Agent": UA } };
  }
  const instances = DEFAULT_INSTANCES;
  for (const base of instances) {
    try {
      const url = base + "/track/?id=" + encodeURIComponent(id) + "&quality=" + encodeURIComponent(quality);
      const r = await upstream(url);
      if (!r.ok) continue;
      const body = await r.json();
      const td = body?.data || body;
      if (!td?.manifest || td.assetPresentation === "PREVIEW" || (td.duration > 0 && td.duration <= 30)) continue;
      const decoded = atob(td.manifest);
      if (td.manifestMimeType?.includes("dash+xml") || decoded.trim().startsWith("<MPD") || decoded.trim().startsWith("<?xml")) continue;
      const payload = JSON.parse(decoded);
      const streamUrl = payload?.urls?.[0];
      if (!streamUrl || !["http:", "https:"].includes(new URL(streamUrl).protocol)) continue;
      return { url: streamUrl, format: "flac", quality, mimeType: "audio/flac", manifest: "none", encrypted: false, sampleRate: Number(payload.sampleRate) || 44100, bitDepth: Number(payload.bitDepth) || 16, headers: { "User-Agent": UA } };
    } catch (_) { /* try next upstream */ }
  }
  return null;
}
export default {
  async fetch(request: Request) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, OPTIONS", "access-control-allow-headers": "*" } });
    if (url.pathname === "/health") return json({ status: "ok", service: "LimX Monochrome" });
    if (url.pathname === "/manifest.json") {
      return json({
        id: "com.limx.addon.monochrome", name: "LimX Monochrome", version: "1.1.0",
        description: "LimX lossless FLAC and Hi-Res music provider powered by the Monochrome API network.",
        author: "LimX", icon: "https://monochrome.st/favicon.ico",
        resources: ["search", "stream", "settings"], types: ["track"], contentType: "music",
        settings: [{ key: "audio_quality", title: "Preferred Audio Quality", type: "select", default: "LOSSLESS", options: [
          { label: "Hi-Res Lossless (24-bit / 192kHz)", value: "HI_RES_LOSSLESS" },
          { label: "Lossless FLAC (16-bit / 44.1kHz)", value: "LOSSLESS" },
          { label: "High (320kbps AAC)", value: "HIGH" }
        ] }]
      });
    }
    if (url.pathname === "/search") {
      const q = (url.searchParams.get("q") || "").trim();
      if (!q) return json({ error: 'Query parameter "q" is required.' }, 400);
      try { return json(await search(q)); } catch (_) { return json({ tracks: [] }); }
    }
    const match = url.pathname.startsWith("/stream/") ? [url.pathname, url.pathname.slice("/stream/".length)] : null;
    if (match) {
      const id = decodeURIComponent(match[1]);
      const requested = url.searchParams.get("quality") || "LOSSLESS";
      const quality = QUALITY.includes(requested) ? requested : "LOSSLESS";
      const result = await resolveStream(id, quality);
      return result ? json(result) : json({ error: "Stream not found" }, 404);
    }
    return json({ error: "Not found" }, 404);
  }
};
