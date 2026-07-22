/**
 * runner.ts — WebSocket client for the FastAPI/CPython backend.
 *
 * POST /run → {session_id}  then  WS /ws/{id}
 *
 * input() detection: Python writes a prompt to stdout (no trailing \n),
 * then blocks. We buffer stdout; if 60ms passes with a partial line
 * still in the buffer, we treat it as a prompt and ask the user.
 */

export type LineType = 'out' | 'err' | 'sys' | 'in';
export interface RunResult { ok: boolean; ms: number; }
export interface RunSignal { aborted: boolean; _ws?: WebSocket; }

// Get backend URL from environment variable or use local
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

export async function runPython(opts: {
  code: string;
  onLine: (type: LineType, text: string) => void;
  onInputRequest: (prompt: string) => Promise<string>;
  signal: RunSignal;
}): Promise<RunResult> {
  const { code, onLine, onInputRequest, signal } = opts;
  const t0 = performance.now();
  const ms = () => Math.round(performance.now() - t0);

  // Determine base URL for backend
  const baseUrl = BACKEND_URL || '';
  const runEndpoint = `${baseUrl}/run`;
  const wsProtocol = BACKEND_URL?.startsWith('https') ? 'wss' : 'ws';

  // ── 1. Create session via REST ─────────────────────────────────────────────
  let sessionId: string;
  try {
    const res = await fetch(runEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    if (!res.ok) {
      let body = `HTTP ${res.status}`;
      try { const t = await res.text(); body += ': ' + t.slice(0, 300); } catch {}
      throw new Error(body);
    }
    const data = await res.json();
    if (!data.session_id) throw new Error('No session_id returned by server');
    sessionId = data.session_id;
  } catch (e: any) {
    // Check if backend URL is configured
    if (!BACKEND_URL) {
      const isVercel = window.location.hostname.includes('vercel.app') || 
                       window.location.hostname.includes('.vercel.app');
      if (isVercel) {
        onLine('err', 'Python execution requires a deployed backend.');
        onLine('sys', 'Set VITE_BACKEND_URL environment variable or run locally with `npm run dev`.');
      } else {
        onLine('err', `Backend error: ${e?.message ?? String(e)}`);
        onLine('sys', 'Make sure Python backend is running on port 8000 with `npm run dev`.');
      }
    } else {
      onLine('err', `Backend connection failed: ${e?.message ?? String(e)}`);
      onLine('sys', 'Check your VITE_BACKEND_URL: ' + BACKEND_URL);
    }
    return { ok: false, ms: ms() };
  }

  if (signal.aborted) return { ok: false, ms: 0 };

  // ── 2. Stream via WebSocket ────────────────────────────────────────────────
  return new Promise<RunResult>((resolve) => {
    let wsUrl: string;
    if (BACKEND_URL) {
      const url = new URL(BACKEND_URL);
      wsUrl = `${wsProtocol}://${url.host}/ws/${sessionId}`;
    } else {
      const proto = location.protocol === 'https:' ? 'wss' : 'ws';
      wsUrl = `${proto}://${location.host}/ws/${sessionId}`;
    }
    
    let ws: WebSocket;
    try { ws = new WebSocket(wsUrl); }
    catch (e: any) {
      onLine('err', `WebSocket error: ${e?.message ?? e}`);
      resolve({ ok: false, ms: ms() });
      return;
    }
    signal._ws = ws;

    let buf = '';                // partial stdout line (may be input prompt)
    let promptTimer: ReturnType<typeof setTimeout> | null = null;
    let waitingInput = false;
    let exitCode = 1;
    let settled = false;

    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      onLine('sys', `Exit ${ok ? 0 : exitCode} · ${ms()}ms`);
      resolve({ ok, ms: ms() });
    };

    const sendStdin = (val: string) => {
      try { ws.send(JSON.stringify({ type: 'stdin', data: val })); } catch {}
    };

    const handlePrompt = async () => {
      if (!buf || waitingInput) return;
      const prompt = buf;
      buf = '';
      waitingInput = true;
      if (signal.aborted) return;
      if (prompt) onLine('sys', prompt);        // show prompt text in terminal
      const val = await onInputRequest(prompt); // wait for user input
      waitingInput = false;
      if (signal.aborted) return;
      onLine('in', val);                        // echo the value
      sendStdin(val);
    };

    ws.onopen = () => {
      if (signal.aborted) {
        try { ws.send(JSON.stringify({ type: 'kill' })); } catch {}
        ws.close();
      }
    };

    ws.onmessage = (ev) => {
      if (signal.aborted) return;
      let msg: { type: string; data?: string; code?: number };
      try { msg = JSON.parse(ev.data); } catch { return; }

      if (msg.type === 'stdout') {
        const text = msg.data ?? '';
        if (promptTimer) { clearTimeout(promptTimer); promptTimer = null; }

        // Emit complete lines immediately; hold partial line in buf
        const combined = buf + text;
        const lines = combined.split('\n');
        buf = lines.pop()!;
        for (const line of lines) onLine('out', line);

        // If partial line sits for 60ms → treat as input() prompt
        if (buf) {
          promptTimer = setTimeout(() => { promptTimer = null; handlePrompt(); }, 60);
        }
      }

      if (msg.type === 'stderr') {
        const lines = (msg.data ?? '').split('\n');
        if (lines[lines.length - 1] === '') lines.pop();
        for (const line of lines) onLine('err', line);
      }

      if (msg.type === 'exit') {
        exitCode = msg.code ?? 1;
        if (promptTimer) { clearTimeout(promptTimer); promptTimer = null; }
        if (buf) { onLine('out', buf); buf = ''; }
        ws.close();
        finish(exitCode === 0);
      }
    };

    ws.onerror = () => {
      onLine('err', 'Lost connection to Python server.');
      onLine('sys', 'The server may be starting up — try again in a moment.');
      finish(false);
    };

    ws.onclose = () => { if (!settled) finish(false); };
  });
}

export function stopExecution(signal: RunSignal) {
  signal.aborted = true;
  if (signal._ws) {
    try { signal._ws.send(JSON.stringify({ type: 'kill' })); } catch {}
    try { signal._ws.close(); } catch {}
    signal._ws = undefined;
  }
}
