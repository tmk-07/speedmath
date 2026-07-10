function normalizeCode(code) {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

const LOCAL_SYNC_KEY = "speedmath.sync-codes.v1";
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function isLocalPreview() {
  return ["localhost", "127.0.0.1"].includes(window.location.hostname);
}

function localCodes() {
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_SYNC_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveLocalCodes(codes) {
  window.localStorage.setItem(LOCAL_SYNC_KEY, JSON.stringify(codes));
}

function generateLocalCode() {
  return Array.from({ length: 8 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join("");
}

function createLocalSyncCode(progress) {
  const codes = localCodes();
  let code = generateLocalCode();
  while (codes[code]) code = generateLocalCode();
  codes[code] = progress;
  saveLocalCodes(codes);
  return { code, localOnly: true };
}

function saveLocalSyncCode(code, progress) {
  const normalized = normalizeCode(code);
  const codes = localCodes();
  codes[normalized] = progress;
  saveLocalCodes(codes);
  return { ok: true, localOnly: true };
}

function loadLocalSyncCode(code) {
  const progress = localCodes()[normalizeCode(code)];
  if (!progress) throw new Error("Code not found in this browser preview.");
  return progress;
}

async function requestJson(path, body) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Sync is not available yet.");
  }
  return data;
}

export async function createSyncCode(progress) {
  try {
    const data = await requestJson("/api/sync/create", { progress });
    return { code: normalizeCode(data.code || ""), localOnly: false };
  } catch (error) {
    if (isLocalPreview()) return createLocalSyncCode(progress);
    throw error;
  }
}

export async function saveSyncCode(code, progress) {
  try {
    return await requestJson("/api/sync/save", { code: normalizeCode(code), progress });
  } catch (error) {
    if (isLocalPreview()) return saveLocalSyncCode(code, progress);
    throw error;
  }
}

export async function loadSyncCode(code) {
  try {
    const data = await requestJson("/api/sync/load", { code: normalizeCode(code) });
    return data.progress;
  } catch (error) {
    if (isLocalPreview()) return loadLocalSyncCode(code);
    throw error;
  }
}

export function displayCode(code) {
  const normalized = normalizeCode(code);
  return normalized.length > 4 ? `${normalized.slice(0, 4)}-${normalized.slice(4)}` : normalized;
}
