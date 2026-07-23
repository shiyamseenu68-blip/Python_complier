/**
 * skulptRunner.ts — Browser-based Python execution using Skulpt
 * 
 * Skulpt is a Python-to-JavaScript transpiler that runs entirely in the browser.
 * No WebAssembly, no CDN dependencies, works on Vercel.
 */

export type LineType = 'out' | 'err' | 'sys' | 'in';
export interface RunResult { ok: boolean; ms: number; }
export interface RunSignal { aborted: boolean; }

let skulptLoaded = false;
let loadingPromise: Promise<void> | null = null;

async function loadSkulpt() {
  if (skulptLoaded) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve, reject) => {
    // Load Skulpt from CDN
    const script1 = document.createElement('script');
    script1.src = 'https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt.min.js';
    script1.onload = () => {
      const script2 = document.createElement('script');
      script2.src = 'https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt-stdlib.js';
      script2.onload = () => {
        skulptLoaded = true;
        resolve();
      };
      script2.onerror = reject;
      document.head.appendChild(script2);
    };
    script1.onerror = reject;
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
    const Sk = window.Sk;
    
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
      inputfun: async (prompt: string) => {
        if (signal.aborted) return '';
        const val = await onInputRequest(prompt);
        onLine('in', val);
        return val;
      },
    });

    Sk.misceval.asyncToPromise(() => {
      return Sk.importMainWithBody("<stdin>", false, code, true);
    }).then(() => {
      onLine('sys', `Exit 0 · ${ms()}ms`);
    }).catch((err: any) => {
      onLine('err', err.toString());
      onLine('sys', `Exit 1 · ${ms()}ms`);
    });

    return { ok: true, ms: ms() };
    
  } catch (e: any) {
    onLine('err', e.message || String(e));
    onLine('sys', `Exit 1 · ${ms()}ms`);
    return { ok: false, ms: ms() };
  }
}

export function stopExecution(signal: RunSignal) {
  signal.aborted = true;
}
