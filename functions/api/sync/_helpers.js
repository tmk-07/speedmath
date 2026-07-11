const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const SESSION_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const PIN_ITERATIONS = 120000;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 10;

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

export function normalizeUsername(username) {
  return String(username || "").trim().toLowerCase();
}

export function validateUsername(username) {
  return /^[a-z0-9_]{3,20}$/.test(username);
}

export function validatePin(pin) {
  return /^\d{4}$/.test(String(pin || ""));
}

function randomString(length, alphabet = SESSION_ALPHABET) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => alphabet[byte % alphabet.length]).join("");
}

function bytesToHex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(value) {
  const clean = String(value || "");
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = Number.parseInt(clean.slice(i, i + 2), 16);
  }
  return bytes;
}

export function createSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

export function createSessionToken() {
  return randomString(40);
}

export async function hashPin(pin, salt) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(String(pin)), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: hexToBytes(salt),
      iterations: PIN_ITERATIONS,
    },
    key,
    256
  );
  return bytesToHex(new Uint8Array(bits));
}

export async function hashToken(token) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(token || "")));
  return bytesToHex(new Uint8Array(digest));
}

export function accountSyncError(error) {
  const message = String(error?.message || "");
  if (message.includes("no such table")) {
    return json({ error: "Account database tables are missing. Run migrations/0002_accounts.sql on the D1 database." }, { status: 500 });
  }
  return json({ error: "Account sync failed. Check the Cloudflare Pages Function logs." }, { status: 500 });
}

export async function rateLimitError(env, username) {
  const row = await env.DB.prepare("SELECT attempts, window_start FROM auth_rate_limits WHERE username = ?").bind(username).first();
  if (!row) return null;

  const windowStart = new Date(row.window_start).getTime();
  if (!Number.isFinite(windowStart) || Date.now() - windowStart >= RATE_LIMIT_WINDOW_MS) return null;
  if (Number(row.attempts) < MAX_LOGIN_ATTEMPTS) return null;

  return json({ error: "Too many PIN attempts. Try again in 15 minutes." }, { status: 429 });
}

export async function recordFailedLogin(env, username) {
  const now = new Date();
  const nowIso = now.toISOString();
  const row = await env.DB.prepare("SELECT attempts, window_start FROM auth_rate_limits WHERE username = ?").bind(username).first();

  if (!row || now.getTime() - new Date(row.window_start).getTime() >= RATE_LIMIT_WINDOW_MS) {
    await env.DB.prepare(
      "INSERT OR REPLACE INTO auth_rate_limits (username, attempts, window_start, updated_at) VALUES (?, ?, ?, ?)"
    )
      .bind(username, 1, nowIso, nowIso)
      .run();
    return;
  }

  await env.DB.prepare("UPDATE auth_rate_limits SET attempts = attempts + 1, updated_at = ? WHERE username = ?")
    .bind(nowIso, username)
    .run();
}

export async function clearFailedLogins(env, username) {
  await env.DB.prepare("DELETE FROM auth_rate_limits WHERE username = ?").bind(username).run();
}

export async function accountFromSession(env, username, token) {
  const normalized = normalizeUsername(username);
  if (!validateUsername(normalized) || !token) return null;
  const tokenHash = await hashToken(token);
  return env.DB.prepare("SELECT username, display_username, state FROM account_users WHERE username = ? AND session_token_hash = ?")
    .bind(normalized, tokenHash)
    .first();
}
