import { generateCode, json, readJson, requireDb, validateProgress } from "./_helpers.js";

export async function onRequestPost({ request, env }) {
  const dbError = requireDb(env);
  if (dbError) return dbError;

  const body = await readJson(request);
  if (!validateProgress(body?.progress)) {
    return json({ error: "Invalid progress data." }, { status: 400 });
  }

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = generateCode();
    const existing = await env.DB.prepare("SELECT code FROM progress_codes WHERE code = ?").bind(code).first();
    if (existing) continue;

    const now = new Date().toISOString();
    await env.DB.prepare(
      "INSERT INTO progress_codes (code, state, created_at, updated_at) VALUES (?, ?, ?, ?)"
    )
      .bind(code, JSON.stringify(body.progress), now, now)
      .run();

    return json({ code });
  }

  return json({ error: "Could not create a unique code. Try again." }, { status: 500 });
}
