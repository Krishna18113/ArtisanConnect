// frontend/src/services/recoService.js
import api from './axiosConfig';

// candidates: [{ id, name, category, price, material, description }]
export async function getRecommendations({ userId, lat, lon, candidates, context = {} }) {
  const nowIso = new Date().toISOString();
  const { data } = await api.post('/reco', {
    user_id: userId,
    lat,
    lon,
    now_iso: nowIso,
    context,
    candidate_items: candidates,
  });
  return data.recommendations; // [itemId, ...]
}

