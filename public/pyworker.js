// Python Worker — runs in a Web Worker thread.
// Uses Atomics.wait() to SYNCHRONOUSLY block while waiting for input().
// This is the ONLY correct way to implement blocking input() in browser Python.
//
// Protocol with the main thread via SharedArrayBuffer:
//   sab[0] (Int32): 0=idle, 1=input_requested, 2=input_ready
//   sab[1..N]: UTF-16 encoded input string (up to 2000 chars)
//
// Message types FROM worker TO main:  { type: 'stdout'|'stderr'|'sys'|'ready'|'done'|'input_request', ... }
// Message types FROM main TO worker:  { type: 'run', code, sab }
//                                     { type: 'input_provided', value }  -- NOT USED (we use Atomics instead)

const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/';

let pyodide = null;
let sab = null;       // SharedArrayBuffer
let controlArr = null; // Int32Array view of sab for Atomics
let dataArr = null;    // Uint16Array view of sab bytes 8+ for string data

async function loadPyodide() {
  if (pyodide) return pyodide;
  self.postMessage({ type: 'sys', text: 'Loading Python 3.11 (Pyodide)…' });
  importScripts(`${PYODIDE_URL}pyodide.js`);
  pyodide = await self.loadPyodide({ indexURL: PYODIDE_URL });
  self.postMessage({ type: 'ready' });
  return pyodide;
}

// ── SAB-based synchronous stdin ──────────────────────────────────────────────
// When Python calls input(), we:
//  1. Post a message to main thread requesting input with the prompt
//  2. Atomics.wait on sab[0] until it becomes 2 (input_ready)
//  3. Read the string from sab and return it
function syncReadline(prompt) {
  // Signal main thread: input needed
  Atomics.store(controlArr, 0, 1); // state = input_requested
  self.postMessage({ type: 'input_request', prompt });

  // Block this worker thread until main sets state to 2
  Atomics.wait(controlArr, 0, 1); // waits while value is 1

  // Read the string back
  const len = Atomics.load(controlArr, 1); // word 1 = string length
  let result = '';
  for (let i = 0; i < len; i++) {
    result += String.fromCharCode(dataArr[i]);
  }

  // Reset state
  Atomics.store(controlArr, 0, 0);
  return result + '\n'; // Python's readline() expects trailing newline
}

self.onmessage = async (e) => {
  const msg = e.data;
  if (msg.type !== 'run') return;

  const { code } = msg;

  // Set up SAB for this run
  sab = msg.sab;
  controlArr = new Int32Array(sab, 0, 16);   // first 64 bytes as Int32
  dataArr    = new Uint16Array(sab, 64);      // rest for string data (up to 4000 chars)

  // Reset SAB state
  Atomics.store(controlArr, 0, 0);

  let py;
  try {
    py = await loadPyodide();
  } catch (err) {
    self.postMessage({ type: 'stderr', text: `Failed to load Python runtime: ${err?.message ?? err}` });
    self.postMessage({ type: 'done', ok: false });
    return;
  }

  // Capture stdout/stderr
  let stdoutBuf = '';
  let stderrBuf = '';

  const flushOut = () => {
    if (stdoutBuf) { self.postMessage({ type: 'stdout', text: stdoutBuf }); stdoutBuf = ''; }
  };
  const flushErr = () => {
    if (stderrBuf) { self.postMessage({ type: 'stderr', text: stderrBuf }); stderrBuf = ''; }
  };

  py.setStdout({
    write(chunk) {
      stdoutBuf += chunk;
      // Flush on newline
      let nl;
      while ((nl = stdoutBuf.indexOf('\n')) !== -1) {
        self.postMessage({ type: 'stdout', text: stdoutBuf.slice(0, nl) });
        stdoutBuf = stdoutBuf.slice(nl + 1);
      }
    },
    isatty: true,
  });

  py.setStderr({
    write(chunk) {
      stderrBuf += chunk;
      let nl;
      while ((nl = stderrBuf.indexOf('\n')) !== -1) {
        self.postMessage({ type: 'stderr', text: stderrBuf.slice(0, nl) });
        stderrBuf = stderrBuf.slice(nl + 1);
      }
    },
    isatty: false,
  });

  // CRITICAL: Set synchronous stdin via readline
  // Pyodide calls this synchronously when Python calls input() or sys.stdin.readline()
  py.setStdin({
    stdin: syncReadline,
    isatty: true,
  });

  const t0 = performance.now();
  let ok = true;

  try {
    // Use runPythonAsync so asyncio / async def work, but input() itself is sync
    await py.runPythonAsync(code);
  } catch (err) {
    ok = false;
    const msg = err?.message ?? String(err);
    // Emit each line of the traceback separately
    msg.split('\n').forEach(line => {
      if (line.trim()) self.postMessage({ type: 'stderr', text: line });
    });
  }

  flushOut();
  flushErr();

  const ms = (performance.now() - t0).toFixed(0);
  self.postMessage({ type: 'sys', text: `Exit ${ok ? 0 : 1} · ${ms}ms` });
  self.postMessage({ type: 'done', ok, ms: +ms });
};
