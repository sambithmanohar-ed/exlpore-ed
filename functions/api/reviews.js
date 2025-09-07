// /functions/api/reviews.js
export async function onRequestGet({ env }) {
  const { DB } = env;
  const { results } = await DB.prepare(
    `SELECT id, name, text, created_at
     FROM reviews
     ORDER BY datetime(created_at) DESC
     LIMIT 100`
  ).all();
  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestPost({ request, env }) {
  const { DB } = env;
  const data = await request.json().catch(() => ({}));
  const name = (data.name || "Anonymous").trim().slice(0, 60);
  const text = (data.text || "").trim();

  if (text.length < 2 || text.length > 600) {
    return new Response(JSON.stringify({ error: "Text must be 2–600 chars." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const id = (await DB.prepare(
    `INSERT INTO reviews (name, text) VALUES (?, ?) RETURNING id`
  ).bind(name, text).first())?.id;

  const saved = await DB.prepare(
    `SELECT id, name, text, created_at FROM reviews WHERE id = ?`
  ).bind(id).first();

  return new Response(JSON.stringify(saved), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
