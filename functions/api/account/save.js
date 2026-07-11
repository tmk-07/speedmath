import { accountFromSession, json, readJson, requireDb, validateProgress } from "../sync/_helpers.js";

export async function onRequestPost({ request, env }) {
  const dbError = requireDb(env);
  if (dbError) return dbError;

  const body = await readJson(request);
  if (!validateProgress(body?.progress)) return json({ error: "Invalid progress data." }, { status: 400 });

  const account = await accountFromSession(env, body?.username, body?.token);
  if (!account) return json({ error: "Sign in again to save progress." }, { status: 401 });

  await env.DB.prepare("UPDATE account_users SET state = ?, updated_at = ? WHERE username = ?")
    .bind(JSON.stringify(body.progress), new Date().toISOString(), account.username)
    .run();

  return json({ ok: true });
}
