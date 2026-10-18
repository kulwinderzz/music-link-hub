const { search } = require('../lib/lookup');
module.exports = async (req, res) => {
  const q = String(req.query.q || '').trim(), type = req.query.type === 'upc' ? 'upc' : 'isrc';
  if (!q) return res.status(400).json({ error: 'q required' });
  try { res.status(200).json({ results: await search(q, type) }); }
  catch (e) { res.status(502).json({ error: e.message }); }
};
