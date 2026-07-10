const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function normalizeCode(code) {
  return String(code || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function validateProgress(progress) {
  if (!progress || typeof progress !== "object") return false;
  return Array.isArray(progress.presets) && Array.isArray(progress.sessions) && typeof progress.activePresetId === "string";
}

export function requireDb(env) {
  if (!env.DB) {
    return json({ error: "Cloud sync needs a Cloudflare D1 binding named DB." }, { status: 503 });
  }
  return null;
}

export function generateCode() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("");
}
