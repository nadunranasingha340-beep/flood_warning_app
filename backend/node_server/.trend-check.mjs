const BASE = 'http://localhost:5002/api';
const j = async (r) => {
  const t = await r.text();
  try { return { status: r.status, body: JSON.parse(t) }; }
  catch { return { status: r.status, body: t.slice(0, 300) }; }
};

const login = await j(await fetch(`${BASE}/auth/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin123' }),
}));
const H = { Authorization: `Bearer ${login.body.token}`, 'Content-Type': 'application/json' };

const mk = (rain, wl, sm) => ({
  1: { rainfall_mm: rain[0], water_level_m: wl[0], soil_moisture: sm[0] },
  2: { rainfall_mm: rain[1], water_level_m: wl[1], soil_moisture: sm[1] },
  3: { rainfall_mm: rain[2], water_level_m: wl[2], soil_moisture: sm[2] },
  4: { rainfall_mm: rain[3], water_level_m: wl[3], soil_moisture: sm[3] },
});

const days = [
  ['2026-10-15', mk([0, 0, 0, 0], [1.66, 2.38, 3.73, 5.29], [0.270, 0.275, 0.279, 0.312])],
  ['2026-10-16', mk([2.1, 0, 5.5, 1.2], [1.68, 2.39, 3.78, 5.31], [0.276, 0.276, 0.286, 0.315])],
  ['2026-10-17', mk([18.4, 12.0, 3.0, 24.5], [1.74, 2.52, 3.80, 5.42], [0.298, 0.290, 0.281, 0.334])],
  ['2026-10-18', mk([33.7, 8.5, 22.1, 5.0], [1.95, 2.61, 4.02, 5.47], [0.318, 0.296, 0.312, 0.328])],
  ['2026-10-19', mk([0, 0, 0, 0], [1.92, 2.58, 3.95, 5.44], [0.312, 0.288, 0.303, 0.321])],
  ['2026-10-20', mk([6.4, 22.0, 1.5, 0], [1.90, 2.72, 3.92, 5.40], [0.306, 0.318, 0.296, 0.315])],
  ['2026-10-21', mk([12.5, 8.0, 22.0, 5.0], [1.95, 2.62, 4.05, 5.48], [0.310, 0.305, 0.330, 0.340])],
];

for (const [date, payload] of days) {
  const res = await post(date, payload);
  if (res.status !== 200) console.log('FAILED', date, res.status, JSON.stringify(res.body));
}
async function post(date, map) {
  return j(await fetch(`${BASE}/telemetry`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ date, stations: Object.entries(map).map(([id, v]) => ({ station_id: Number(id), ...v })) }),
  }));
}

for (const range of ['daily', 'weekly', 'monthly', 'yearly']) {
  const res = await j(await fetch(`${BASE}/trends?range=${range}&station=all`, { headers: H }));
  console.log(`\n=== ${range.toUpperCase()} (${res.status}) threshold=${res.body.threshold} points=${res.body.points.length} ===`);
  console.table(res.body.points.slice(0, 8).map((p) => ({
    category: p.category, actual: p.actual, predicted: p.predicted,
  })));
}

const single = await j(await fetch(`${BASE}/trends?range=daily&station=2`, { headers: H }));
console.log('\n=== DAILY, station=2 only ===');
console.table(single.body.points.map((p) => ({ category: p.category, actual: p.actual, predicted: p.predicted })));

const multi = await j(await fetch(`${BASE}/trends?range=daily&station=1,3`, { headers: H }));
console.log('\n=== DAILY, station=1,3 ===');
console.table(multi.body.points.slice(0, 6).map((p) => ({ category: p.category, actual: p.actual, predicted: p.predicted })));
console.log('stations in multi:', [...new Set(multi.body.points.map((p) => p.station_code))].join(', '));
