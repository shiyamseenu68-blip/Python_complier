/**
 * brythonRunner.ts — Browser-based Python execution using Brython
 * 
 * Brython is a Python 3 implementation for the browser that compiles
 * Python to JavaScript. More reliable CDN than Skulpt.
 */

export type LineType = 'out' | 'err' | 'sys' | 'in';
export interface RunResult { ok: boolean; ms: number; }
export interface RunSignal { aborted: boolean; }

let brythonLoaded = false;
let loadingPromise: Promise<void> | null = null;

async function loadBrython() {
  if (brythonLoaded) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve, reject) => {
    // Load Brython from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/brython@3.12.3/brython.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      // Load Brython stdlib
      const stdlib = document.createElement('script');
      stdlib.src = 'https://cdn.jsdelivr.net/npm/brython@3.12.3/brython_stdlib.js';
      stdlib.crossOrigin = 'anonymous';
      stdlib.onload = () => {
        brythonLoaded = true;
        resolve();
      };
      stdlib.onerror = () => {
        reject(new Error('Failed to load Brython stdlib'));
      };
      document.head.appendChild(stdlib);
    };
    script.onerror = () => {
      reject(new Error('Failed to load Brython core'));
    };
    document.head.appendChild(script);
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
    await loadBrython();
    
    if (signal.aborted) return { ok: false, ms: 0 };

    // @ts-ignore - Brython adds itself to global scope
    const brython = window.brython;
    if (!brython) {
      throw new Error('Brython failed to load');
    }
    
    // Create a hidden div for Brython output
    const outputDiv = document.createElement('div');
    outputDiv.id = 'brython-output-' + Date.now();
    outputDiv.style.display = 'none';
    document.body.appendChild(outputDiv);
    
    // Override sys.stdout and sys.stderr
    const wrappedCode = `
import sys
from browser import document, console

class OutputCapture:
    def __init__(self, type):
        self.type = type
        self.output = []
    
    def write(self, text):
        if text:
            self.output.append((self.type, text))
    
    def flush(self):
        pass

sys.stdout = OutputCapture('out')
sys.stderr = OutputCapture('err')

${code}

# Get all output
outputs = []
outputs.extend(sys.stdout.output)
outputs.extend(sys.stderr.output)
outputs
    `;
    
    try {
      // @ts-ignore
      const result = window.brython(wrappedCode, { 
        target: outputDiv.id,
        static_stdlib_import: false
      });
      
      onLine('sys', `Exit 0 · ${ms()}ms`);
      document.body.removeChild(outputDiv);
      return { ok: true, ms: ms() };
    } catch (err: any) {
      onLine('err', err.toString());
      onLine('sys', `Exit 1 · ${ms()}ms`);
      document.body.removeChild(outputDiv);
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
