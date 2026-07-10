import { json, normalizeCode, readJson, requireDb, validateProgress } from "./_helpers.js";

export async function onRequestPost({ request, env }) {
  const dbError = requireDb(env);
  if (dbError) return dbError;

  const body = await readJson(request);
  const code = normalizeCode(body?.code);
  if (!code) return json({ error: "Enter a code first." }, { status: 400 });
  if (!validateProgress(body?.progress)) return json({ error: "Invalid progress data." }, { status: 400 });

  const result = await env.DB.prepare("UPDATE progress_codes SET state = ?, updated_at = ? WHERE code = ?")
    .bind(JSON.stringify(body.progress), new Date().toISOString(), code)
    .run();

  if (!result.meta?.changes) return json({ error: "Code not found." }, { status: 404 });
  return json({ ok: true });
}
