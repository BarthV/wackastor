// UEXcorp API Spike Probe Script
// Probes /items categories 1-50 and checks location ID collisions

const API_BASE = 'https://api.uexcorp.space/2.0';

async function fetchJson(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
  return resp.json();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function probeCategories() {
  console.log('=== ITEM CATEGORIES PROBE ===\n');
  const categories = [];
  let totalItems = 0;
  let firstRecord = null;

  for (let catId = 1; catId <= 50; catId++) {
    try {
      const data = await fetchJson(`${API_BASE}/items?id_category=${catId}`);
      const items = data.data || [];
      if (items.length > 0) {
        const name = items[0].category || `Category ${catId}`;
        const section = items[0].section || '';
        categories.push({ id: catId, name, section, itemCount: items.length });
        totalItems += items.length;
        console.log(`  Category ${catId}: ${name} (${section}) - ${items.length} items`);
        if (!firstRecord) firstRecord = items[0];
      }
    } catch (e) {
      console.log(`  Category ${catId}: ERROR - ${e.message}`);
    }
    await sleep(600); // ~100 req/min to be safe
  }

  console.log(`\nTotal categories with data: ${categories.length}`);
  console.log(`Total items: ${totalItems}`);

  const largest = categories.reduce((a, b) => a.itemCount > b.itemCount ? a : b, { itemCount: 0 });
  console.log(`Largest: id=${largest.id} "${largest.name}" with ${largest.itemCount} items`);

  if (firstRecord) {
    console.log(`\nItem fields: ${JSON.stringify(Object.keys(firstRecord).sort())}`);
  }

  console.log(`\nCategory list JSON:`);
  console.log(JSON.stringify(categories, null, 2));
}

async function checkIdCollisions() {
  console.log('\n=== LOCATION ID COLLISION CHECK ===\n');
  const endpoints = ['planets', 'moons', 'space_stations', 'cities', 'outposts'];
  const allIds = {};

  for (const ep of endpoints) {
    const data = await fetchJson(`${API_BASE}/${ep}`);
    const ids = (data.data || []).map(r => r.id);
    allIds[ep] = new Set(ids);
    console.log(`  ${ep}: ${ids.length} IDs, range ${Math.min(...ids)}-${Math.max(...ids)}`);
    await sleep(600);
  }

  console.log('\n--- Pairwise Collision Check ---');
  for (let i = 0; i < endpoints.length; i++) {
    for (let j = i + 1; j < endpoints.length; j++) {
      const ep1 = endpoints[i], ep2 = endpoints[j];
      const overlap = [...allIds[ep1]].filter(id => allIds[ep2].has(id));
      if (overlap.length > 0) {
        console.log(`  COLLISION: ${ep1} & ${ep2} share ${overlap.length} IDs: [${overlap.slice(0, 15).join(', ')}]${overlap.length > 15 ? '...' : ''}`);
      } else {
        console.log(`  OK: ${ep1} & ${ep2} - no overlap`);
      }
    }
  }
}

async function main() {
  await probeCategories();
  await checkIdCollisions();
}

main().catch(e => { console.error(e); process.exit(1); });
