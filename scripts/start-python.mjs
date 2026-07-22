/**
 * scripts/start-python.mjs
 *
 * Runs as `predev` before Vite starts.
 * 1. Installs Python deps if missing.
 * 2. Starts uvicorn on port 8000 in the background (detached).
 * 3. Waits up to 10s for the health endpoint to respond.
 * 4. Exits 0 always — never blocks Vite.
 *
 * Uses only Node.js built-ins.
 */

import { spawnSync, spawn } from 'child_process';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { setTimeout as sleep } from 'timers/promises';
import http from 'http';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const ROOT       = resolve(__dirname, '..');
const SERVER_DIR = resolve(ROOT, 'server');
const SERVER_PY  = resolve(SERVER_DIR, 'main.py');
const PORT       = 8000;
const PYTHON     = process.platform === 'win32' ? 'python' : '/usr/bin/python3';
const UVICORN    = process.platform === 'win32' ? null : '/home/appuser/.local/bin/uvicorn';

function log(msg) {
  process.stdout.write(`[python] ${msg}\n`);
}

function ping() {
  return new Promise((ok) => {
    try {
      const req = http.get(`http://127.0.0.1:${PORT}/health`, (res) => {
        ok(res.statusCode === 200);
      });
      req.on('error', () => ok(false));
      req.setTimeout(600, () => { req.destroy(); ok(false); });
    } catch {
      ok(false);
    }
  });
}

// ── 1. Ensure server/main.py exists ──────────────────────────────────────────

if (!existsSync(SERVER_PY)) {
  log(`ERROR: ${SERVER_PY} not found — cannot start backend`);
  process.exit(0);
}

// ── 2. Install Python deps if missing ────────────────────────────────────────

const depCheck = spawnSync(PYTHON, ['-c', 'import fastapi, uvicorn, websockets'], {
  encoding: 'utf8',
  timeout: 5000,
});
if (depCheck.status !== 0) {
  log('Installing Python deps (fastapi uvicorn websockets)…');
  const inst = spawnSync(
    'pip3',
    ['install', 'fastapi', 'uvicorn[standard]', 'websockets',
     '--break-system-packages', '-q', '--quiet'],
    { stdio: 'inherit', encoding: 'utf8', timeout: 60000 },
  );
  if (inst.status !== 0) {
    log('WARNING: pip install failed');
  }
}

// ── 3. Check if already running ──────────────────────────────────────────────

if (await ping()) {
  log(`Already running on :${PORT}`);
  process.exit(0);
}

// ── 4. Start uvicorn ─────────────────────────────────────────────────────────

const cmd  = existsSync(UVICORN) ? UVICORN : null;
const args = cmd
  ? [SERVER_PY, '--host', '0.0.0.0', '--port', String(PORT), '--log-level', 'warning']
  : null;

// uvicorn takes a module:attr OR a file path (Uvicorn 0.30+ supports file path directly)
// To be safe, use "main:app" from within SERVER_DIR
const startCmd  = cmd || PYTHON;
const startArgs = cmd
  ? ['main:app', '--host', '0.0.0.0', '--port', String(PORT), '--log-level', 'warning']
  : ['-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', String(PORT), '--log-level', 'warning'];

log(`Starting: ${startCmd} ${startArgs.join(' ')}`);

const child = spawn(startCmd, startArgs, {
  cwd: SERVER_DIR,
  detached: true,
  stdio: 'ignore',
  env: { ...process.env, PYTHONUNBUFFERED: '1' },
});
child.unref();

// ── 5. Wait up to 10 s ───────────────────────────────────────────────────────

let ready = false;
for (let i = 0; i < 20; i++) {
  await sleep(500);
  if (await ping()) {
    log(`Server ready on :${PORT}`);
    ready = true;
    break;
  }
}

if (!ready) {
  log(`WARNING: server not responding after 10s — Vite will start anyway`);
}

process.exit(0);
