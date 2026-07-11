import {
  accountSyncError,
  clearFailedLogins,
  createSessionToken,
  hashPin,
  hashToken,
  json,
  normalizeUsername,
  rateLimitError,
  readJson,
  recordFailedLogin,
  requireDb,
  validatePin,
  validateUsername,
} from "../sync/_helpers.js";

function invalidLogin() {
  return json({ error: "Invalid username or PIN." }, { status: 401 });
}

export async function onRequestPost({ request, env }) {
  try {
    return await handleLogin({ request, env });
  } catch (error) {
    return accountSyncError(error);
  }
}

async function handleLogin({ request, env }) {
  const dbError = requireDb(env);
  if (dbError) return dbError;

  const body = await readJson(request);
  const username = normalizeUsername(body?.username);

  if (!validateUsername(username) || !validatePin(body?.pin)) {
    return invalidLogin();
  }

  const limitError = await rateLimitError(env, username);
  if (limitError) return limitError;

  const row = await env.DB.prepare(
    "SELECT username, display_username, pin_salt, pin_hash, state FROM account_users WHERE username = ?"
  )
    .bind(username)
    .first();

  if (!row) {
    await recordFailedLogin(env, username);
    return invalidLogin();
  }

  const pinHash = await hashPin(body.pin, row.pin_salt);
  if (pinHash !== row.pin_hash) {
    await recordFailedLogin(env, username);
    return invalidLogin();
  }

  const token = createSessionToken();
  const tokenHash = await hashToken(token);
  const now = new Date().toISOString();

  await env.DB.prepare("UPDATE account_users SET session_token_hash = ?, last_login_at = ?, updated_at = ? WHERE username = ?")
    .bind(tokenHash, now, now, username)
    .run();
  await clearFailedLogins(env, username);

  return json({ account: { username: row.display_username }, token, progress: JSON.parse(row.state) });
}
