/**
 * skulptRunner.ts — Browser-based Python execution using Skulpt
 * 
 * Skulpt is a Python-to-JavaScript transpiler that runs entirely in the browser.
 * No WebAssembly, minimal CDN dependencies, works on Vercel.
 */

export type LineType = 'out' | 'err' | 'sys' | 'in';
export interface RunResult { ok: boolean; ms: number; }
export interface RunSignal { aborted: boolean; }

let skulptLoaded = false;
let loadingPromise: Promise<void> | null = null;
let pendingInput: string = '';

async function loadSkulpt() {
  if (skulptLoaded) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve, reject) => {
    // Load Skulpt from CDN with fallback
    const script1 = document.createElement('script');
    script1.src = 'https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt.min.js';
    script1.crossOrigin = 'anonymous';
    script1.onload = () => {
      const script2 = document.createElement('script');
      script2.src = 'https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt-stdlib.js';
      script2.crossOrigin = 'anonymous';
      script2.onload = () => {
        skulptLoaded = true;
        resolve();
      };
      script2.onerror = () => {
        reject(new Error('Failed to load Skulpt stdlib'));
      };
      document.head.appendChild(script2);
    };
    script1.onerror = () => {
      reject(new Error('Failed to load Skulpt core'));
    };
    document.head.appendChild(script1);
  });

  await loadingPromise;
}

export async function runPython(opts: {
  code: string;
  onLine: (type: LineType, text: string) => void;
  onInputRequest: (prompt: string) => Promise<string>;
  signal: RunSignal;
}): Promise<RunResult> {
  const { code, onLine, onInputRequest, signal } = opts;
  const t0 = performance.now();
  const ms = () => Math.round(performance.now() - t0);

  try {
    await loadSkulpt();
    
    if (signal.aborted) return { ok: false, ms: 0 };

    // @ts-ignore - Skulpt adds itself to global scope
    const Sk = window.Sk    
    if (!Sk) {
      throw new Error('Skulpt failed to load');
    }
    
    const output: string[] = [];
    
    Sk.configure({
      output: (text: string) => {
        output.push(text);
        const lines = text.split('\n');
        for (const line of lines) {
          if (line) onLine('out', line);
        }
      },
      read: (x: string) => {
        if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined) {
          throw "File not found: '" + x + "'";
        }
        return Sk.builtinFiles["files"][x];
      },
      inputfun: (prompt: string) => {
        // Skulpt requires synchronous input, so we use a blocking approach
        if (signal.aborted) return '';
        // Store the prompt and return immediately
        // The actual input will be handled asynchronously
        onInputRequest(prompt).then((val) => {
          pendingInput = val;
          onLine('in', val);
        });
        // Return empty string first, actual value will be used on next call
        return pendingInput || '';
      },
    });

    try {
      await Sk.misceval.asyncToPromise(() => {
        return Sk.importMainWithBody("<stdin>", false, code, true);
      });
      onLine('sys', `Exit 0 · ${ms()}ms`);
      return { ok: true, ms: ms() };
    } catch (err: any) {
      onLine('err', err.toString());
      onLine('sys', `Exit 1 · ${ms()}ms`);
      return { ok: false, ms: ms() };
    }
    
  } catch (e: any) {
    onLine('err', e.message || String(e));
    onLine('sys', `Exit 1 · ${ms()}ms`);
    return { ok: false, ms: ms() };
  }
}

export function stopExecution(signal: RunSignal) {
  signal.aborted = true;
}
