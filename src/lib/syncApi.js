function normalizeCode(code) {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

const LOCAL_SYNC_KEY = "speedmath.sync-codes.v1";
const LOCAL_ACCOUNT_KEY = "speedmath.accounts.v1";
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

function normalizeUsername(username) {
  return username.trim().toLowerCase();
}

function localAccounts() {
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_ACCOUNT_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveLocalAccounts(accounts) {
  window.localStorage.setItem(LOCAL_ACCOUNT_KEY, JSON.stringify(accounts));
}

function validateLocalAccount(username, pin) {
  const normalized = normalizeUsername(username);
  if (!/^[a-z0-9_]{3,20}$/.test(normalized)) throw new Error("Use 3-20 letters, numbers, or underscores for username.");
  if (!/^\d{4}$/.test(pin)) throw new Error("Use a 4 digit PIN.");
  return normalized;
}

function localToken() {
  return Array.from({ length: 40 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join("");
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

function createLocalAccount(username, pin, progress) {
  const normalized = validateLocalAccount(username, pin);
  const accounts = localAccounts();
  if (accounts[normalized]) throw new Error("That username is already taken.");
  const token = localToken();
  accounts[normalized] = {
    username: username.trim(),
    pin,
    token,
    progress,
    attempts: 0,
    windowStart: 0,
  };
  saveLocalAccounts(accounts);
  return { account: { username: username.trim() }, token, progress, localOnly: true };
}

function loginLocalAccount(username, pin) {
  const normalized = validateLocalAccount(username, pin);
  const accounts = localAccounts();
  const account = accounts[normalized];
  const now = Date.now();
  if (account && now - Number(account.windowStart || 0) >= 15 * 60 * 1000) {
    account.attempts = 0;
    account.windowStart = 0;
  }
  if (account?.attempts >= 10) {
    saveLocalAccounts(accounts);
    throw new Error("Too many PIN attempts. Try again in 15 minutes.");
  }
  if (!account || account.pin !== pin) {
    if (account) {
      account.attempts = Number(account.attempts || 0) + 1;
      account.windowStart = account.windowStart || now;
      saveLocalAccounts(accounts);
    }
    throw new Error("Invalid username or PIN.");
  }
  account.attempts = 0;
  account.windowStart = 0;
  account.token = localToken();
  saveLocalAccounts(accounts);
  return { account: { username: account.username }, token: account.token, progress: account.progress, localOnly: true };
}

function saveLocalAccount(username, token, progress) {
  const accounts = localAccounts();
  const account = accounts[normalizeUsername(username)];
  if (!account || account.token !== token) throw new Error("Sign in again to save progress.");
  account.progress = progress;
  saveLocalAccounts(accounts);
  return { ok: true, localOnly: true };
}

async function accountRequest(path, body) {
  return requestJson(path, body);
}

export async function registerAccount(username, pin, progress) {
  try {
    return await accountRequest("/api/account/register", { username, pin, progress });
  } catch (error) {
    if (isLocalPreview()) return createLocalAccount(username, pin, progress);
    throw error;
  }
}

export async function loginAccount(username, pin) {
  try {
    return await accountRequest("/api/account/login", { username, pin });
  } catch (error) {
    if (isLocalPreview()) return loginLocalAccount(username, pin);
    throw error;
  }
}

export async function saveAccountProgress(account, progress) {
  try {
    return await accountRequest("/api/account/save", {
      username: account.username,
      token: account.token,
      progress,
    });
  } catch (error) {
    if (isLocalPreview()) return saveLocalAccount(account.username, account.token, progress);
    throw error;
  }
}

export async function logoutAccount(account) {
  if (!account?.username || !account?.token) return { ok: true };
  try {
    return await accountRequest("/api/account/logout", {
      username: account.username,
      token: account.token,
    });
  } catch (error) {
    if (isLocalPreview()) return { ok: true, localOnly: true };
    throw error;
  }
}
