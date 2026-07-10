import { json, normalizeCode, readJson, requireDb } from "./_helpers.js";

export async function onRequestPost({ request, env }) {
  const dbError = requireDb(env);
  if (dbError) return dbError;

  const body = await readJson(request);
  const code = normalizeCode(body?.code);
  if (!code) return json({ error: "Enter a code first." }, { status: 400 });

  const row = await env.DB.prepare("SELECT state FROM progress_codes WHERE code = ?").bind(code).first();
  if (!row) return json({ error: "Code not found." }, { status: 404 });

  return json({ progress: JSON.parse(row.state) });
}
