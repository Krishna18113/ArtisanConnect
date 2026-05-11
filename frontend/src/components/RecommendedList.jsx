
// frontend/src/components/RecommendedList.jsx
import { useEffect, useState } from 'react';
import { getRecommendations } from '@/services/recoService';           // use alias for consistency
import { getProducts } from '@/services/productService';               // named import
import { getMyDirectOrders } from '@/services/orderService';

function getSeason(month) {
  if ([2, 3, 4, 5].includes(month)) return 'summer';
  if ([6, 7, 8, 9].includes(month)) return 'monsoon';
  return 'winter';
}

function getFestivalContext(date = new Date()) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const festivals = [];

  if (month === 1 && day >= 10 && day <= 18) festivals.push('makar sankranti');
  if (month === 3 && day >= 1 && day <= 20) festivals.push('holi');
  if (month === 8 && day >= 10 && day <= 25) festivals.push('raksha bandhan');
  if (month === 9 && day >= 1 && day <= 20) festivals.push('ganesh chaturthi');
  if (month === 10 && day >= 1 && day <= 15) festivals.push('dussehra');
  if ((month === 10 && day >= 16) || (month === 11 && day <= 15)) festivals.push('diwali');
  if (month === 12 && day >= 20 && day <= 31) festivals.push('christmas');

  return {
    season: getSeason(month),
    festivals,
    festival: festivals[0] || 'none',
  };
}

export default function RecommendedList({ user, location }) {
  const [recommended, setRecommended] = useState([]);

  const lat = location?.lat ?? 28.6139;
  const lon = location?.lon ?? 77.2090;

  useEffect(() => {
    async function run() {
      // 1) fetch products and remove anything the buyer has already ordered
      const [res, ordersRes] = await Promise.all([
        getProducts({}),
        getMyDirectOrders(),
      ]);
      const products = Array.isArray(res) ? res : (res?.data || []);   // read res.data
      const orders = Array.isArray(ordersRes) ? ordersRes : (ordersRes?.data || []);
      const orderedProductIds = new Set(
        orders
          .map(order => order.productId?._id || order.productId)
          .filter(Boolean)
          .map(String)
      );
      const context = getFestivalContext();

      const eligibleProducts = products.filter(p => !orderedProductIds.has(String(p._id)));
      const candidates = eligibleProducts.slice(0, 30).map(p => ({
        id: p._id,
        name: p.name,
        category: p.category,
        // align with your schema; Products.jsx shows pricePerKg in use
        price: p.pricePerKg ?? p.price ?? 0,
        material: p.material || '',
        description: p.description || '',
      }));

      if (!candidates.length) {
        setRecommended([]);
        return;
      }

      // 2) ask backend for ranked IDs
      const ids = await getRecommendations({
        userId: user?._id || 'guest',
        lat,
        lon,
        candidates,
        context,
      });

      // 3) map IDs back to product objects
      const map = new Map(eligibleProducts.map(p => [String(p._id), p]));
      const ranked = ids.map(id => map.get(String(id))).filter(Boolean);
      setRecommended(ranked);
    }
    run().catch(console.error);
  }, [user?._id, lat, lon]);

  if (!recommended.length) return null;

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))',
    gap: 16
  };

  return (
    <section style={{ marginTop: 24 }}>
      <h3>Recommended for you</h3>
      <div style={gridStyle}>
        {recommended.map(p => (
          <div key={p._id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: 600 }}>{p.name}</div>
            <div style={{ color: '#666' }}>{p.category}</div>
            <div style={{ marginTop: 6 }}>₹ {p.pricePerKg ?? p.price}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
