import {
  accountSyncError,
  clearFailedLogins,
  createSalt,
  createSessionToken,
  hashPin,
  hashToken,
  json,
  normalizeUsername,
  readJson,
  requireDb,
  validatePin,
  validateProgress,
  validateUsername,
} from "../../_shared/syncHelpers.js";

export async function onRequestPost({ request, env }) {
  try {
    return await handleRegister({ request, env });
  } catch (error) {
    return accountSyncError(error);
  }
}

async function handleRegister({ request, env }) {
  const dbError = requireDb(env);
  if (dbError) return dbError;

  const body = await readJson(request);
  const username = normalizeUsername(body?.username);
  const displayUsername = String(body?.username || "").trim();

  if (!validateUsername(username)) {
    return json({ error: "Use 3-20 letters, numbers, or underscores for username." }, { status: 400 });
  }
  if (!validatePin(body?.pin)) {
    return json({ error: "Use a 4 digit PIN." }, { status: 400 });
  }
  if (!validateProgress(body?.progress)) {
    return json({ error: "Invalid progress data." }, { status: 400 });
  }

  const existing = await env.DB.prepare("SELECT username FROM account_users WHERE username = ?").bind(username).first();
  if (existing) return json({ error: "That username is already taken." }, { status: 409 });

  const salt = createSalt();
  const pinHash = await hashPin(body.pin, salt);
  const token = createSessionToken();
  const tokenHash = await hashToken(token);
  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO account_users
      (username, display_username, pin_salt, pin_hash, session_token_hash, state, created_at, updated_at, last_login_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(username, displayUsername, salt, pinHash, tokenHash, JSON.stringify(body.progress), now, now, now)
    .run();

  await clearFailedLogins(env, username);
  return json({ account: { username: displayUsername }, token, progress: body.progress });
}
