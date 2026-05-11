const { embedTexts } = require('../utils/hfClient');

// cosine similarity: (A·B)/(|A||B|)
function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-12);
}

const CONTEXT_KEYWORDS = {
  summer: ['summer', 'cool', 'cotton', 'lightweight', 'drink', 'juice', 'pickle', 'mango'],
  monsoon: ['monsoon', 'rain', 'waterproof', 'tea', 'snack', 'spice', 'umbrella'],
  winter: ['winter', 'warm', 'wool', 'blanket', 'shawl', 'jacket', 'sweater'],
  'makar sankranti': ['til', 'sesame', 'jaggery', 'kite', 'sankranti', 'sweet'],
  holi: ['holi', 'color', 'gulal', 'sweet', 'gujiya', 'thandai', 'festival'],
  'raksha bandhan': ['rakhi', 'gift', 'sweet', 'bracelet', 'raksha bandhan'],
  'ganesh chaturthi': ['ganesh', 'modak', 'sweet', 'decor', 'idol', 'festival'],
  dussehra: ['dussehra', 'decor', 'gift', 'festival', 'traditional'],
  diwali: ['diwali', 'diya', 'lamp', 'candle', 'sweet', 'gift', 'decor', 'rangoli'],
  christmas: ['christmas', 'cake', 'gift', 'decor', 'candle', 'winter'],
};

const GENERAL_KEYWORDS = ['handmade', 'local', 'artisan', 'traditional', 'organic', 'fresh', 'natural'];

function itemText(item) {
  return [
    item.name,
    item.category,
    item.material,
    item.description,
    item.tags ? item.tags.join(' ') : '',
  ].filter(Boolean).join(' ').toLowerCase();
}

function contextBoost(item, context) {
  const activeContexts = [
    context.season,
    context.festival,
    ...(Array.isArray(context.festivals) ? context.festivals : []),
  ].filter(Boolean);

  const keywords = [...new Set(
    activeContexts.flatMap(key => CONTEXT_KEYWORDS[String(key).toLowerCase()] || [])
  )];

  if (!keywords.length) return 0;

  const text = itemText(item);

  const matches = keywords.filter(keyword => text.includes(keyword)).length;
  return Math.min(matches * 0.08, 0.4);
}

function localContextScore(item, context) {
  const text = itemText(item);
  const generalMatches = GENERAL_KEYWORDS.filter(keyword => text.includes(keyword)).length;
  const ratingBoost = Math.min(Number(item.averageRating) || 0, 5) * 0.02;
  const recencyBoost = item.createdAt ? Math.max(0, 0.05 - ((Date.now() - new Date(item.createdAt).getTime()) / 86400000) * 0.001) : 0;

  return contextBoost(item, context) + generalMatches * 0.02 + ratingBoost + recencyBoost;
}

async function embeddingRank(ctx, candidateItems, itemIds, context) {
  const itemTexts = candidateItems.map(item => itemText(item));
  const [ctxVec, ...itemVecs] = await embedTexts([ctx, ...itemTexts]);

  return itemVecs.map((v, i) => ({
    id: itemIds[i],
    score: cosine(ctxVec, v) + localContextScore(candidateItems[i], context),
  }));
}

exports.recommend = async (req, res) => {
  try {
    const { user_id, lat, lon, now_iso, candidate_items = [], context = {} } = req.body;

    // 1) Build a simple “context string” for the user + situation (festival/weather/etc.)
    const ctx = [
      `user=${user_id || 'guest'}`,
      `lat=${lat}`, `lon=${lon}`, `time=${now_iso || new Date().toISOString()}`,
      `festival=${context.festival || 'none'}`,
      `festivals=${Array.isArray(context.festivals) ? context.festivals.join(',') : 'none'}`,
      `season=${context.season || 'none'}`,
      `weather=${context.weather || 'normal'}`
    ].join('; ');

    if (!candidate_items.length) {
      return res.json({ recommendations: [] });
    }

    // 2) Rank locally by season/festival/product metadata. This keeps recommendations fast
    // during demos and avoids a network call per product on every request.
    const itemIds = candidate_items.map(c => c.id);
    let scored = candidate_items.map((item, i) => ({
      id: itemIds[i],
      score: localContextScore(item, context),
    }));

    // 3) Optional embedding ranking for production. Disabled by default because the hosted
    // Hugging Face call can be slow when done per request.
    if (process.env.USE_HF_RECO === 'true') {
      scored = await embeddingRank(ctx, candidate_items, itemIds, context);
    }

    scored = scored.filter(item => item.score > 0);
    scored.sort((a, b) => b.score - a.score);

    // 4) Return top N ids
    return res.json({ recommendations: scored.slice(0, 10).map(s => s.id) });
  } catch (e) {
    console.error('Reco error:', e?.response?.data || e?.message);
    const status = e?.response?.status || 502;
    return res.status(status).json({ message: 'Embedding/Ranking failed', detail: e?.response?.data || e?.message });
  }
};
