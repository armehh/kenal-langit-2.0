require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');


const app = express();
const PORT = process.env.PORT || 3000;
const BBOX = 'lamin=0.8&lomin=99.5&lamax=7.4&lomax=119.5'; // Malaysian airspace
const DATA_FILE = path.join(__dirname, 'data', 'leaderboard.json');

app.set('trust proxy', 1); // Render sits behind a proxy; this makes req.ip the real visitor IP
app.use(express.json({ limit: '2kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Flights: proxy OpenSky with a short cache ----------
let cache = { t: 0, data: [] };
let token = { value: null, exp: 0 };

// Optional: OpenSky OAuth2 client credentials give higher rate limits than anonymous access.
async function getToken() {
  const { OPENSKY_CLIENT_ID: id, OPENSKY_CLIENT_SECRET: secret } = process.env;
  if (!id || !secret) return null;
  if (token.value && Date.now() < token.exp) return token.value;
  const r = await fetch('https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: id, client_secret: secret }),
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error('token ' + r.status);
  const j = await r.json();
  token = { value: j.access_token, exp: Date.now() + (j.expires_in - 30) * 1000 };
  return token.value;
}

// Log once at startup so Render Logs show whether the credentials were picked up
console.log('OpenSky credentials:', process.env.OPENSKY_CLIENT_ID && process.env.OPENSKY_CLIENT_SECRET ? 'set' : 'NOT set (anonymous, likely rate-limited on cloud IPs)');
console.log('AirLabs key:', process.env.AIRLABS_API_KEY ? 'set' : 'NOT set');

app.get('/api/flights', async (req, res) => {
  if (Date.now() - cache.t < 15000) return res.json({ source: 'cache', flights: cache.data });
  try {
    const headers = {};
    try {
      const tk = await getToken();
      if (tk) headers.Authorization = `Bearer ${tk}`;
    } catch (e) {
      console.warn('OpenSky token error:', e.message, e.cause?.code || ''); // falls back to anonymous
    }
    const r = await fetch(`https://opensky-network.org/api/states/all?${BBOX}`, { headers, signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error('opensky ' + r.status + (headers.Authorization ? ' (with token)' : ' (anonymous)'));
    const d = await r.json();
    const flights = (d.states || [])
      .filter(s => s[5] != null && s[6] != null && !s[8]) // has position, airborne
      .map(s => ({
        icao: s[0],
        cs: (s[1] || '').trim(),
        country: s[2],
        lat: s[6],
        lng: s[5],
        alt: s[13] ?? s[7],
        vel: s[9],
        hdg: s[10] || 0,
        vr: s[11],
      }));
    cache = { t: Date.now(), data: flights };
    res.json({ source: 'opensky', flights });
  } catch (e) {
    console.warn('Flights error:', e.message, e.cause?.code || '');
    // frontend shows sample data if flights is empty; `error` tells you why
    res.json({ source: 'stale', error: e.message, flights: cache.data });
  }
});

// ---------- Route lookup: callsign -> origin/destination via adsbdb (free, no key) ----------
// ADS-B does not carry origin/destination, so we look the callsign up. Results are cached briefly in memory only.
const routeCache = new Map();            // callsign -> { t, data }
const ROUTE_TTL = 10 * 60 * 1000;        // found routes
const ROUTE_TTL_MISS = 5 * 60 * 1000;    // unknown callsigns
const routeHits = new Map();             // ip -> { t, n } (protects adsbdb's rate limit)
const routeLimited = ip => {
  const now = Date.now(), h = routeHits.get(ip);
  if (routeHits.size > 1000) routeHits.clear();
  if (!h || now - h.t > 60000) { routeHits.set(ip, { t: now, n: 1 }); return false; }
  return ++h.n > 30;
};
const airportOut = a => a && ({ iata: a.iata_code || null, icao: a.icao_code || null, name: a.name || null, city: a.municipality || null, country: a.country_name || null });

async function lookupRoute(cs) {
  // Try the callsign as-is, then without leading zeros (MAS073 -> MAS73)
  for (const c of [...new Set([cs, cs.replace(/^([A-Z]{3})0+(?=\d)/, '$1')])]) {
    const r = await fetch(`https://api.adsbdb.com/v0/callsign/${encodeURIComponent(c)}`, { signal: AbortSignal.timeout(6000) });
    if (r.status === 404) continue;
    if (!r.ok) throw new Error('adsbdb ' + r.status);
    const fr = (await r.json())?.response?.flightroute;
    if (fr && fr.origin && fr.destination) {
      return { callsign: fr.callsign || c, airline: fr.airline?.name || null, origin: airportOut(fr.origin), destination: airportOut(fr.destination) };
    }
  }
  return null;
}

app.get('/api/route/:callsign', async (req, res) => {
  const cs = String(req.params.callsign || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{2,8}$/.test(cs)) return res.status(400).json({ error: 'Invalid callsign' });
  const hit = routeCache.get(cs);
  if (hit && Date.now() - hit.t < (hit.data ? ROUTE_TTL : ROUTE_TTL_MISS)) return res.json({ route: hit.data, cached: true });
  if (routeLimited(req.ip)) return res.status(429).json({ error: 'Too many requests' });
  try {
    const data = await lookupRoute(cs);
    if (routeCache.size > 500) routeCache.delete(routeCache.keys().next().value);
    routeCache.set(cs, { t: Date.now(), data });
    res.json({ route: data });
  } catch (e) {
    console.warn('Route error:', e.message);
    res.status(502).json({ error: 'Route lookup failed' });
  }
});

// ---------- Flight status: delay/status via AirLabs (the key stays on the server) ----------
const statusCache = new Map();            // callsign -> { t, data }
const STATUS_TTL = 5 * 60 * 1000;         // found
const STATUS_TTL_MISS = 10 * 60 * 1000;   // not found (it still costs a query, so cache it longer)
const statusHits = new Map();             // ip -> { t, n }
const statusLimited = ip => {
  const now = Date.now(), h = statusHits.get(ip);
  if (statusHits.size > 1000) statusHits.clear();
  if (!h || now - h.t > 60000) { statusHits.set(ip, { t: now, n: 1 }); return false; }
  return ++h.n > 20;
};
let airlabsDay = { d: '', n: 0 };         // daily cap protects the free plan (1,000 queries per month)
const airlabsBudget = () => {
  const d = new Date().toISOString().slice(0, 10);
  if (airlabsDay.d !== d) airlabsDay = { d, n: 0 };
  return airlabsDay.n < (Number(process.env.AIRLABS_DAILY_CAP) || 30);
};
// Send only the fields the app needs, not the raw AirLabs response
const statusOut = f => ({
  flight: f.flight_iata || null,
  airline: f.airline_name || null,
  status: f.status || null,               // scheduled | en-route | landed | cancelled
  aircraft: f.aircraft_icao || null,
  reg: f.reg_number || null,
  delayed: f.delayed ?? null,             // minutes
  dep: { iata: f.dep_iata || null, city: f.dep_city || null, terminal: f.dep_terminal || null, gate: f.dep_gate || null,
         scheduled: f.dep_time || null, estimated: f.dep_estimated || null, actual: f.dep_actual || null, delayed: f.dep_delayed ?? null },
  arr: { iata: f.arr_iata || null, city: f.arr_city || null, terminal: f.arr_terminal || null, gate: f.arr_gate || null, baggage: f.arr_baggage || null,
         scheduled: f.arr_time || null, estimated: f.arr_estimated || null, actual: f.arr_actual || null, delayed: f.arr_delayed ?? null },
  progress: f.percent ?? null,            // % of the flight completed
  eta: f.eta ?? null,                     // minutes to arrival
  updated: f.updated ?? null,
});

async function lookupStatus(cs) {
  // Try the callsign as-is, then without leading zeros (MAS073 -> MAS73)
  for (const c of [...new Set([cs, cs.replace(/^([A-Z]{3})0+(?=\d)/, '$1')])]) {
    if (!airlabsBudget()) throw new Error('daily cap reached');
    airlabsDay.n++;
    const r = await fetch(`https://airlabs.co/api/v9/flight?flight_icao=${encodeURIComponent(c)}&api_key=${encodeURIComponent(process.env.AIRLABS_API_KEY)}`, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error('airlabs http ' + r.status);
    const j = await r.json();
    if (j.error) {
      const m = String(j.error.code || j.error.message || '').toLowerCase();
      if (/key|limit|quota|expire|auth|forbid|block/.test(m)) throw new Error('airlabs ' + m);
      continue;                           // flight not found: try the next variant
    }
    const f = j.response;
    if (f && (f.dep_iata || f.arr_iata)) return statusOut(f);
  }
  return null;
}

app.get('/api/status/:callsign', async (req, res) => {
  if (!process.env.AIRLABS_API_KEY) return res.status(503).json({ error: 'not_configured' });
  const cs = String(req.params.callsign || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{2,8}$/.test(cs)) return res.status(400).json({ error: 'Invalid callsign' });
  const hit = statusCache.get(cs);
  if (hit && Date.now() - hit.t < (hit.data ? STATUS_TTL : STATUS_TTL_MISS)) return res.json({ status: hit.data, cached: true });
  if (statusLimited(req.ip)) return res.status(429).json({ error: 'too_many_requests' });
  try {
    const data = await lookupStatus(cs);
    if (statusCache.size > 300) statusCache.delete(statusCache.keys().next().value);
    statusCache.set(cs, { t: Date.now(), data });
    res.json({ status: data });
  } catch (e) {
    console.warn('Status error:', e.message);
    res.status(502).json({ error: 'status_unavailable' });
  }
});

// ---------- Leaderboard: JSON file storage ----------
const LEVELS = ['easy', 'med', 'hard'];
const readBoard = () => { try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return []; } };
const lastPost = new Map();

app.get('/api/leaderboard', (req, res) => {
  res.json(readBoard().sort((a, b) => b.score - a.score).slice(0, 10));
});

app.post('/api/leaderboard', (req, res) => {
  const ip = req.ip;
  if (Date.now() - (lastPost.get(ip) || 0) < 10000) return res.status(429).json({ error: 'Too fast' });
  const { name, score, level, mode } = req.body || {};
  const clean = typeof name === 'string' ? name.replace(/[<>]/g, '').trim().slice(0, 20) : '';
  // Max score for a 10-question round with a full streak is well under 300.
  if (!clean || !Number.isInteger(score) || score < 0 || score > 300 || !LEVELS.includes(level) || !(Number.isInteger(mode) && mode >= 1 && mode <= 7)) {
    return res.status(400).json({ error: 'Invalid entry' });
  }
  lastPost.set(ip, Date.now());
  const board = readBoard();
  board.push({ name: clean, score, level, mode, date: new Date().toISOString() });
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(board.sort((a, b) => b.score - a.score).slice(0, 100)));
  res.status(201).json({ ok: true });
});

app.listen(PORT, () => console.log(`KenalLangit running at http://localhost:${PORT}`));