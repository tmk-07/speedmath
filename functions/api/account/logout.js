import { accountFromSession, accountSyncError, json, readJson, requireDb } from "../sync/_helpers.js";

export async function onRequestPost({ request, env }) {
  try {
    return await handleLogout({ request, env });
  } catch (error) {
    return accountSyncError(error);
  }
}

async function handleLogout({ request, env }) {
  const dbError = requireDb(env);
  if (dbError) return dbError;

  const body = await readJson(request);
  const account = await accountFromSession(env, body?.username, body?.token);
  if (account) {
    await env.DB.prepare("UPDATE account_users SET session_token_hash = NULL, updated_at = ? WHERE username = ?")
      .bind(new Date().toISOString(), account.username)
      .run();
  }

  return json({ ok: true });
}
