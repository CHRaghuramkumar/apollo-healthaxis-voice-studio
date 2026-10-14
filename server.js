'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

loadEnv(path.join(__dirname, '.env'));

const DIRECTIONS = [
  { id: 'inbound', label: 'Inbound' },
  { id: 'outbound', label: 'Outbound' }
];
const CATEGORIES = [
  { id: 'appointment-booking', label: 'Appointment booking' },
  { id: 'rescheduling', label: 'Rescheduling' },
  { id: 'cancellations', label: 'Cancellations' },
  { id: 'reminders', label: 'Reminders' },
  { id: 'prohealth', label: 'ProHealth check-up' },
  { id: 'no-show', label: 'No-show follow-up' },
  { id: 'post-discharge', label: 'Post-discharge care' },
  { id: 'patient-support', label: 'Patient support' }
];
const PORT = Number(process.env.PORT) || 8000;
const DATA_FILE = path.join(__dirname, 'data', 'use-cases.json');
const SESSION_MS = 12 * 60 * 60 * 1000;
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

const PUBLIC_FILES = new Map([
  ['/', 'index.html'],
  ['/index.html', 'index.html'],
  ['/admin', 'admin.html'],
  ['/admin.html', 'admin.html'],
  ['/app.js', 'app.js'],
  ['/drag.js', 'drag.js'],
  ['/logo.webp', 'logo.webp']
]);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.webp': 'image/webp'
};

let cache = null;
let queue = Promise.resolve();

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (url.pathname.startsWith('/api/')) {
      await handleApi(req, res, url);
      return;
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      sendText(res, 405, 'Method not allowed');
      return;
    }
    const file = PUBLIC_FILES.get(url.pathname);
    if (!file) {
      sendText(res, 404, 'Not found');
      return;
    }
    const body = fs.readFileSync(path.join(__dirname, file));
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
      'Content-Length': body.length,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'same-origin',
      'X-Frame-Options': 'SAMEORIGIN'
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (err) {
    if (res.headersSent) {
      console.error(err);
      return;
    }
    const status = Number(err.status) || 500;
    if (status >= 500) console.error(err);
    sendJson(res, status, { error: status >= 500 ? 'Something went wrong.' : err.message });
  }
});

server.listen(PORT, () => {
  const password = Boolean(process.env.ADMIN_PASSWORD);
  const key = Boolean(apiKey());
  console.log(`Apollo HealthAxis Voice Studio`);
  console.log(`  Site   http://localhost:${PORT}`);
  console.log(`  Admin  http://localhost:${PORT}/admin`);
  console.log(`  Admin password: ${password ? 'configured' : 'NOT SET — set ADMIN_PASSWORD'}`);
  console.log(`  ElevenLabs API key: ${key ? 'configured' : 'NOT SET — set ELEVENLABS_API_KEY'}`);
});

async function handleApi(req, res, url) {
  if (!originOk(req)) {
    sendJson(res, 403, { error: 'This request was blocked.' });
    return;
  }
  const route = `${req.method} ${url.pathname}`;
  if (route === 'GET /api/use-cases') {
    sendJson(res, 200, { filters: filterCatalog(), useCases: readUseCases().map(publicUseCase) });
    return;
  }
  if (route === 'POST /api/conversation') {
    await startConversation(req, res);
    return;
  }
  if (route === 'POST /api/admin/login') {
    await login(req, res);
    return;
  }
  if (route === 'POST /api/admin/logout') {
    sendJson(res, 200, { ok: true }, { 'Set-Cookie': clearCookie() });
    return;
  }
  if (!admin(req)) {
    sendJson(res, 401, { error: 'Sign in required.' });
    return;
  }
  if (route === 'GET /api/admin/session') {
    sendJson(res, 200, { ok: true, elevenlabs: Boolean(apiKey()) });
    return;
  }
  if (route === 'GET /api/admin/use-cases') {
    sendJson(res, 200, { filters: filterCatalog(), useCases: readUseCases() });
    return;
  }
  if (route === 'POST /api/admin/use-cases') {
    await createUseCase(req, res);
    return;
  }
  if (route === 'POST /api/admin/use-cases/reorder') {
    await reorderUseCases(req, res);
    return;
  }
  const one = url.pathname.match(/^\/api\/admin\/use-cases\/([A-Za-z0-9_-]{1,80})$/);
  if (one && req.method === 'PUT') {
    await updateUseCase(req, res, one[1]);
    return;
  }
  if (one && req.method === 'DELETE') {
    await deleteUseCase(res, one[1]);
    return;
  }
  sendJson(res, 404, { error: 'Not found' });
}

async function login(req, res) {
  const ip = clientIp(req);
  if (count(`login:${ip}`, 10 * 60 * 1000) >= 8) {
    sendJson(res, 429, { error: 'Too many sign-in attempts. Wait a few minutes and try again.' });
    return;
  }
  const password = process.env.ADMIN_PASSWORD || '';
  if (!password) {
    sendJson(res, 503, { error: 'Admin password is not configured. Set ADMIN_PASSWORD in the server environment.' });
    return;
  }
  const body = await readBody(req);
  if (!safeEqual(String(body.password || ''), password)) {
    hit(`login:${ip}`, 10 * 60 * 1000);
    sendJson(res, 401, { error: 'Incorrect password.' });
    return;
  }
  const token = signSession({ role: 'admin', exp: Date.now() + SESSION_MS });
  sendJson(res, 200, { ok: true, elevenlabs: Boolean(apiKey()) }, { 'Set-Cookie': sessionCookie(token) });
}

async function createUseCase(req, res) {
  const parsed = parseUseCase(await readBody(req));
  if (parsed.errors.length) {
    sendJson(res, 400, { error: parsed.errors[0], errors: parsed.errors });
    return;
  }
  const now = new Date().toISOString();
  const record = { id: 'uc_' + crypto.randomBytes(8).toString('hex'), ...parsed.value, createdAt: now, updatedAt: now };
  await mutate(list => [...list, record]);
  sendJson(res, 201, { useCase: record });
}

async function updateUseCase(req, res, id) {
  const parsed = parseUseCase(await readBody(req));
  if (parsed.errors.length) {
    sendJson(res, 400, { error: parsed.errors[0], errors: parsed.errors });
    return;
  }
  let updated = null;
  const next = await mutate(list => {
    const i = list.findIndex(u => u.id === id);
    if (i < 0) return null;
    updated = { ...list[i], ...parsed.value, updatedAt: new Date().toISOString() };
    const copy = list.slice();
    copy[i] = updated;
    return copy;
  });
  if (!next) {
    sendJson(res, 404, { error: 'Use case not found.' });
    return;
  }
  sendJson(res, 200, { useCase: updated });
}

async function deleteUseCase(res, id) {
  let removed = false;
  await mutate(list => {
    const next = list.filter(u => u.id !== id);
    removed = next.length !== list.length;
    return removed ? next : null;
  });
  if (!removed) {
    sendJson(res, 404, { error: 'Use case not found.' });
    return;
  }
  sendJson(res, 200, { ok: true });
}

async function reorderUseCases(req, res) {
  const body = await readBody(req);
  const ids = Array.isArray(body.ids) ? body.ids.map(String) : null;
  if (!ids) {
    sendJson(res, 400, { error: 'Expected a list of ids.' });
    return;
  }
  let error = null;
  const next = await mutate(list => {
    const current = list.map(u => u.id);
    if (ids.length !== current.length || !current.every(id => ids.includes(id))) {
      error = 'The order does not match the current use cases.';
      return null;
    }
    const byId = new Map(list.map(u => [u.id, u]));
    return ids.map(id => byId.get(id));
  });
  if (!next) {
    sendJson(res, 400, { error: error || 'Could not reorder.' });
    return;
  }
  sendJson(res, 200, { useCases: next });
}

async function startConversation(req, res) {
  const ip = clientIp(req);
  if (limited(`chat:${ip}`, 30, 60 * 1000)) {
    sendJson(res, 429, { error: 'Too many conversation requests. Wait a moment and try again.' });
    return;
  }
  const body = await readBody(req);
  const id = String(body.id || '');
  const mode = body.mode === 'text' ? 'text' : body.mode === 'voice' ? 'voice' : '';
  if (!mode) {
    sendJson(res, 400, { error: 'Choose voice or text chat.' });
    return;
  }
  const useCase = readUseCases().find(u => u.id === id);
  if (!useCase) {
    sendJson(res, 404, { error: 'Use case not found.' });
    return;
  }
  if (!useCase.agentId) {
    sendJson(res, 409, { error: 'This use case does not have an agent ID yet. Add one in the admin.' });
    return;
  }
  const key = apiKey();
  if (!key) {
    sendJson(res, 503, { error: 'The ElevenLabs API key is not configured on the server.' });
    return;
  }
  const agentId = encodeURIComponent(useCase.agentId);
  try {
    if (mode === 'text') {
      const data = await eleven(`/v1/convai/conversation/get-signed-url?agent_id=${agentId}`, key);
      if (!data.signed_url) throw new Error('ElevenLabs did not return a conversation URL.');
      sendJson(res, 200, { signedUrl: data.signed_url });
      return;
    }
    const data = await eleven(`/v1/convai/conversation/token?agent_id=${agentId}`, key);
    if (!data.token) throw new Error('ElevenLabs did not return a conversation token.');
    sendJson(res, 200, { token: data.token });
  } catch (err) {
    const status = err.status || 502;
    sendJson(res, status, { error: err.message || 'Could not start the conversation.' });
  }
}

async function eleven(pathname, key) {
  const response = await fetch('https://api.elevenlabs.io' + pathname, {
    headers: { 'xi-api-key': key },
    signal: AbortSignal.timeout(15000)
  });
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
  if (!response.ok) {
    const error = new Error(elevenMessage(response.status, data));
    error.status = response.status === 404 ? 404 : 502;
    throw error;
  }
  return data;
}

function elevenMessage(status, data) {
  if (status === 401) return 'The ElevenLabs API key was rejected. Check ELEVENLABS_API_KEY on the server.';
  if (status === 404) return 'ElevenLabs could not find this agent. Check the agent ID.';
  const detail = data && data.detail;
  let message = '';
  if (typeof detail === 'string') message = detail;
  else if (detail && typeof detail.message === 'string') message = detail.message;
  else if (typeof data.message === 'string') message = data.message;
  message = message.replace(/xi_[A-Za-z0-9]+/g, '').trim().slice(0, 240);
  return message || 'ElevenLabs could not start this conversation.';
}

function filterCatalog() {
  return { directions: DIRECTIONS, categories: CATEGORIES };
}

function parseUseCase(body) {
  const title = oneLine(body.title, 140);
  const description = paragraph(body.description, 800);
  const agentId = oneLine(body.agentId, 80);
  const direction = oneLine(body.direction, 40);
  const known = new Set(CATEGORIES.map(c => c.id));
  const categories = [...new Set((Array.isArray(body.categories) ? body.categories : []).map(c => oneLine(c, 40)).filter(id => known.has(id)))];
  const errors = [];
  if (!title) errors.push('Title is required.');
  if (!description) errors.push('Description is required.');
  if (!DIRECTIONS.some(d => d.id === direction)) errors.push('Choose inbound or outbound.');
  if (!categories.length) errors.push('Choose at least one use case.');
  if (agentId && !/^agent_[A-Za-z0-9_-]{6,64}$/.test(agentId)) errors.push('Agent ID should look like agent_abc123.');
  return { errors, value: { title, description, direction, categories, agentId } };
}

function oneLine(value, max) {
  return String(value ?? '').replace(/[\u0000-\u001F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function paragraph(value, max) {
  return String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/[ \t]+\n/g, '\n').trim().slice(0, max);
}

function publicUseCase(u) {
  return {
    id: u.id,
    title: u.title,
    direction: u.direction,
    categories: u.categories,
    description: u.description,
    chatEnabled: Boolean(u.agentId)
  };
}

function normalize(u) {
  const knownDir = new Set(DIRECTIONS.map(d => d.id));
  const knownCat = new Set(CATEGORIES.map(c => c.id));
  let direction = oneLine(u.direction, 40);
  let categories = [...new Set((Array.isArray(u.categories) ? u.categories : []).map(c => oneLine(c, 40)).filter(id => knownCat.has(id)))];
  if (!knownDir.has(direction) || !categories.length) {
    const legacy = legacyFilters(u.id);
    if (!knownDir.has(direction)) direction = legacy.direction;
    if (!categories.length) categories = legacy.categories;
  }
  if (!knownDir.has(direction)) direction = 'inbound';
  return {
    id: oneLine(u.id, 80) || 'uc_' + crypto.randomBytes(4).toString('hex'),
    title: oneLine(u.title, 140),
    direction,
    categories,
    description: paragraph(u.description, 800),
    agentId: oneLine(u.agentId, 80),
    createdAt: u.createdAt || new Date().toISOString(),
    updatedAt: u.updatedAt || u.createdAt || new Date().toISOString()
  };
}

function legacyFilters(id) {
  const map = {
    booking: { direction: 'inbound', categories: ['appointment-booking', 'rescheduling'] },
    reminders: { direction: 'outbound', categories: ['reminders', 'cancellations'] },
    prohealth: { direction: 'outbound', categories: ['prohealth'] },
    noshow: { direction: 'outbound', categories: ['no-show'] },
    engagement: { direction: 'outbound', categories: ['post-discharge'] },
    support: { direction: 'inbound', categories: ['patient-support'] }
  };
  return map[id] || { direction: '', categories: [] };
}

function readUseCases() {
  if (cache) return cache;
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    if (!Array.isArray(parsed)) throw new Error('Use case file is not a list.');
    cache = parsed.map(normalize);
    return cache;
  } catch (err) {
    if (err.code === 'ENOENT') {
      cache = [];
      persist(cache);
      return cache;
    }
    throw err;
  }
}

function persist(list) {
  const tmp = DATA_FILE + '.tmp';
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2) + '\n');
  fs.renameSync(tmp, DATA_FILE);
  cache = list;
}

function mutate(fn) {
  const run = queue.then(async () => {
    const current = readUseCases().map(u => ({ ...u }));
    const next = await fn(current);
    if (next) persist(next);
    return next;
  });
  queue = run.then(() => {}, () => {});
  return run;
}

function admin(req) {
  const token = parseCookies(req).ahx_admin;
  const session = token && verifySession(token);
  return Boolean(session && session.role === 'admin');
}

function signSession(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifySession(token) {
  const split = String(token).split('.');
  if (split.length !== 2) return null;
  const [body, sig] = split;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (!data.exp || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

function sessionCookie(token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `ahx_admin=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${Math.floor(SESSION_MS / 1000)}${secure}`;
}

function clearCookie() {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `ahx_admin=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`;
}

function parseCookies(req) {
  const out = {};
  String(req.headers.cookie || '').split(';').forEach(part => {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

function originOk(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

function clientIp(req) {
  return String(req.socket.remoteAddress || 'local');
}

const buckets = new Map();
function recent(key, windowMs) {
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter(t => now - t < windowMs);
  buckets.set(key, hits);
  return hits;
}
function count(key, windowMs) {
  return recent(key, windowMs).length;
}
function hit(key, windowMs) {
  const hits = recent(key, windowMs);
  hits.push(Date.now());
  buckets.set(key, hits);
}
function limited(key, max, windowMs) {
  const hits = recent(key, windowMs);
  if (hits.length >= max) return true;
  hits.push(Date.now());
  buckets.set(key, hits);
  return false;
}

function apiKey() {
  return process.env.ELEVENLABS_API_KEY || process.env.XI_API_KEY || '';
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) {
    crypto.timingSafeEqual(left, left);
    return false;
  }
  return crypto.timingSafeEqual(left, right);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > 65536) {
        reject(Object.assign(new Error('Payload too large'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(Object.assign(new Error('Invalid JSON'), { status: 400 }));
      }
    });
    req.on('error', reject);
  }).catch(err => {
    if (!err.status) err.status = 400;
    throw err;
  });
}

function sendJson(res, status, obj, extra) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...(extra || {})
  });
  res.end(body);
}

function sendText(res, status, text) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(text);
}

function loadEnv(file) {
  let text = '';
  try { text = fs.readFileSync(file, 'utf8'); } catch { return; }
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const i = trimmed.indexOf('=');
    if (i < 1) continue;
    const key = trimmed.slice(0, i).trim();
    let value = trimmed.slice(i + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] == null) process.env[key] = value;
  }
}

process.on('unhandledRejection', err => {
  console.error(err);
});
