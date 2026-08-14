import { accountFromSession, accountSyncError, json, readJson, requireDb } from "../../_shared/syncHelpers.js";

export async function onRequestPost({ request, env }) {
  try {
    return await handleDelete({ request, env });
  } catch (error) {
    return accountSyncError(error);
  }
}

async function handleDelete({ request, env }) {
  const dbError = requireDb(env);
  if (dbError) return dbError;

  const body = await readJson(request);
  const account = await accountFromSession(env, body?.username, body?.token);
  if (!account) return json({ error: "Sign in again to delete your data." }, { status: 401 });

  await env.DB.batch([
    env.DB.prepare("DELETE FROM auth_rate_limits WHERE username = ?").bind(account.username),
    env.DB.prepare("DELETE FROM account_users WHERE username = ?").bind(account.username),
  ]);

  return json({ ok: true });
}
