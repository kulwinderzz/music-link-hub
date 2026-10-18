const { resolve, clean } = require('../lib/lookup');
module.exports = async (req, res) => {
  try {
    const data = await resolve(clean(req.query.code));
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).json(data);
  } catch (e) { res.status(400).json({ error: e.message }); }
};
