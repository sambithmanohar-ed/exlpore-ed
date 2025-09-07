export async function onRequestGet({ env, request }) {
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 200);
  const { results } = await env.DB
    .prepare(`SELECT id, name, text, created_at FROM reviews ORDER BY created_at DESC LIMIT ?`)
    .bind(limit)
    .all();
  return new Response(JSON.stringify({ items: results || [] }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestPost({ env, request }) {
  const body = await request.json().catch(() => ({}));
  const name = (body.name || 'Anonymous').toString().slice(0, 80);
  const text = (body.text || '').toString().trim();
  if (text.length < 2 || text.length > 600) {
    return new Response(JSON.stringify({ error: 'text length out of range' }), { status: 400 });
  }
  const id = crypto.randomUUID().replace(/-/g, '');
  await env.DB.prepare(
    `INSERT INTO reviews (id, name, text, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`
  ).bind(id, name, text).run();
  return new Response(JSON.stringify({ ok: true, id }), {
    headers: { 'Content-Type': 'application/json' },
    status: 201
  });
}
