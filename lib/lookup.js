const enc = encodeURIComponent;
const kind = c => /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(c) ? 'isrc' : /^\d{12,13}$/.test(c) ? 'upc' : null;
const clean = s => String(s || '').replace(/[\s-]/g, '').toUpperCase();
async function j(url, opt) {
  const r = await fetch(url, opt);
  if (!r.ok) throw new Error(url.split('?')[0] + ' ' + r.status);
  return r.json();
}
let tok = { v: null, exp: 0 };
async function spToken() {
  const id = process.env.SPOTIFY_CLIENT_ID, sec = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !sec) return null;
  if (tok.v && Date.now() < tok.exp) return tok.v;
  const r = await j('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: 'Basic ' + Buffer.from(id + ':' + sec).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  });
  tok = { v: r.access_token, exp: Date.now() + (r.expires_in - 60) * 1000 };
  return tok.v;
}
const NAMES = { spotify: 'Spotify', appleMusic: 'Apple Music', itunes: 'iTunes', youtubeMusic: 'YouTube Music', youtube: 'YouTube', amazonMusic: 'Amazon Music', amazonStore: 'Amazon Store', deezer: 'Deezer', tidal: 'Tidal', soundcloud: 'SoundCloud', pandora: 'Pandora', napster: 'Napster', anghami: 'Anghami', audiomack: 'Audiomack', boomplay: 'Boomplay', yandex: 'Yandex Music', spinrilla: 'Spinrilla' };

// code (ISRC/UPC) -> { type, meta, links:[{name,url,direct}] }
async function resolve(code) {
  const type = kind(code);
  if (!type) throw new Error('Valid ISRC (12 chars) ya UPC/EAN (12-13 digits) daalo');
  const meta = {}, links = {};
  const add = (name, url) => { if (url && !links[name]) links[name] = url; };
  const fill = m => Object.keys(m).forEach(k => { if (m[k] && !meta[k]) meta[k] = m[k]; });
  // 1) Deezer (no key needed)
  try {
    const d = await j(type === 'isrc' ? `https://api.deezer.com/track/isrc:${code}` : `https://api.deezer.com/album/upc:${code}`);
    if (!d.error) {
      fill(type === 'isrc'
        ? { title: d.title, artist: d.artist?.name, album: d.album?.title, cover: d.album?.cover_xl }
        : { title: d.title, artist: d.artist?.name, album: d.title, cover: d.cover_xl });
      add('Deezer', d.link);
    }
  } catch (e) {}
  // 2) Spotify (needs keys)
  try {
    const t = await spToken();
    if (t) {
      const ty = type === 'isrc' ? 'track' : 'album';
      const s = await j(`https://api.spotify.com/v1/search?type=${ty}&limit=1&q=${enc((type === 'isrc' ? 'isrc:' : 'upc:') + code)}`, { headers: { Authorization: 'Bearer ' + t } });
      const it = s[ty + 's']?.items?.[0];
      if (it) {
        add('Spotify', it.external_urls?.spotify);
        const al = ty === 'track' ? it.album : it;
        fill({ title: it.name, artist: it.artists?.map(a => a.name).join(', '), album: al?.name, cover: al?.images?.[0]?.url });
      }
    }
  } catch (e) {}
  // 3) Odesli expands one known URL into every platform
  const seed = links.Spotify || links.Deezer;
  if (seed) {
    try {
      const o = await j(`https://api.song.link/v1-alpha.1/links?url=${enc(seed)}&userCountry=IN${process.env.ODESLI_KEY ? '&key=' + process.env.ODESLI_KEY : ''}`);
      for (const [k, v] of Object.entries(o.linksByPlatform || {})) add(NAMES[k] || k, v.url);
      const e = o.entitiesByUniqueId?.[o.entityUniqueId];
      if (e) fill({ title: e.title, artist: e.artistName, cover: e.thumbnailUrl });
    } catch (e) {}
  }
  const out = Object.entries(links).map(([name, url]) => ({ name, url, direct: true }));
  // 4) Stores without public APIs: search links
  const q = enc([meta.artist, meta.title].filter(Boolean).join(' ') || code);
  [['JioSaavn', `https://www.jiosaavn.com/search/${q}`], ['Gaana', `https://gaana.com/search/${q}`], ['Wynk Music', `https://www.google.com/search?q=${q}+site:wynk.in`]]
    .forEach(([name, url]) => { if (!links[name]) out.push({ name, url, direct: false }); });
  return { code, type, meta, links: out };
}

// title/artist -> candidates with ISRC / UPC (Deezer, no key)
async function search(q, type) {
  if (type === 'upc') {
    const r = await j(`https://api.deezer.com/search/album?limit=6&q=${enc(q)}`);
    return Promise.all((r.data || []).map(async a => {
      try { const d = await j(`https://api.deezer.com/album/${a.id}`); return { title: d.title, artist: d.artist?.name, code: d.upc, cover: d.cover_medium, year: (d.release_date || '').slice(0, 4) }; }
      catch (e) { return { title: a.title, artist: a.artist?.name, code: null }; }
    }));
  }
  const r = await j(`https://api.deezer.com/search?limit=6&q=${enc(q)}`);
  return Promise.all((r.data || []).map(async t => {
    try { const d = await j(`https://api.deezer.com/track/${t.id}`); return { title: d.title, artist: d.artist?.name, code: d.isrc, cover: d.album?.cover_medium, year: (d.release_date || '').slice(0, 4) }; }
    catch (e) { return { title: t.title, artist: t.artist?.name, code: null }; }
  }));
}
module.exports = { resolve, search, clean, kind };
