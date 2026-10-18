const { resolve, clean } = require('../lib/lookup');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  try {
    const d = await resolve(clean(req.query.code)), m = d.meta;
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    const btn = d.links.map(l => `<a href="${esc(l.url)}" rel="noopener"><span>${esc(l.name)}</span><span>${l.direct ? 'Play' : 'Search'}</span></a>`).join('');
    res.status(200).send(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(m.title || d.code)} – ${esc(m.artist || '')}</title>
<meta property="og:title" content="${esc(m.title || d.code)} – ${esc(m.artist || '')}"><meta property="og:image" content="${esc(m.cover || '')}">
<style>body{margin:0;min-height:100vh;display:flex;justify-content:center;align-items:center;background:linear-gradient(160deg,#1b2447,#3a1d4a);font-family:system-ui,sans-serif;color:#fff}
.c{width:min(380px,92vw);padding:24px;text-align:center}img{width:220px;height:220px;object-fit:cover;border-radius:12px}h1{margin:14px 0 2px;font-size:24px}p{margin:0 0 16px;opacity:.8}
a{display:flex;justify-content:space-between;background:rgba(255,255,255,.14);color:#fff;text-decoration:none;padding:12px 16px;border-radius:10px;margin-top:10px;font-weight:600}a:hover{background:rgba(255,255,255,.25)}</style></head>
<body><div class="c">${m.cover ? `<img src="${esc(m.cover)}" alt="Cover art">` : ''}<h1>${esc(m.title || d.code)}</h1><p>${esc(m.artist || '')}</p>${btn}</div></body></html>`);
  } catch (e) { res.status(404).send(`<p style="font-family:sans-serif;padding:24px">Release nahi mila: ${esc(e.message)}</p>`); }
};
