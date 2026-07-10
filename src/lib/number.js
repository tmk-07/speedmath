export function randInt(min, max) {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

export function clampNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function formatSeconds(s) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function formatMs(ms) {
  if (!ms) return "0.0s";
  return `${(ms / 1000).toFixed(1)}s`;
}

export function pct(n) {
  return `${Math.round(n * 100)}%`;
}
