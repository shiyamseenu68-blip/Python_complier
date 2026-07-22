/**
 * pyodideRunner.ts — Browser-based Python execution using Pyodide
 * 
 * This runs Python entirely in the browser using WebAssembly, no backend required.
 * Supports most Python features including input(), functions, loops, classes.
 */

import { loadPyodide } from 'pyodide';

export type LineType = 'out' | 'err' | 'sys' | 'in';
export interface RunResult { ok: boolean; ms: number; }
export interface RunSignal { aborted: boolean; }

let pyodide: any = null;
let loadingPromise: Promise<any> | null = null;

async function getPyodide() {
  if (pyodide) return pyodide;
  if (loadingPromise) return loadingPromise;
  
  loadingPromise = loadPyodide({
    indexURL: 'https://unpkg.com/pyodide@0.23.4/full/'
  });
  
  pyodide = await loadingPromise;
  
  // Set up stdout/stderr capture
  pyodide.runPython(`
import sys
from io import StringIO

class OutputCapture:
    def __init__(self):
        self.outputs = []
    
    def write(self, text):
        self.outputs.append(('out', text))
    
    def flush(self):
        pass

class ErrorCapture:
    def __init__(self):
        self.outputs = []
    
    def write(self, text):
        self.outputs.append(('err', text))
    
    def flush(self):
        pass

sys.stdout = OutputCapture()
sys.stderr = ErrorCapture()
  `);
  
  return pyodide;
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
    const py = await getPyodide();
    
    // Reset output capture
    py.runPython(`
sys.stdout.outputs = []
sys.stderr.outputs = []
    `);
    
    // Handle input() by redirecting to a custom function
    py.globals.set('onInputRequest', async (prompt: string) => {
      if (signal.aborted) return '';
      const val = await onInputRequest(prompt);
      onLine('in', val);
      return val;
    });
    
    // Override input() function
    py.runPython(`
def input(prompt=''):
    import sys
    return onInputRequest(prompt)
    `);
    
    // Run the user code
    if (signal.aborted) return { ok: false, ms: 0 };
    
    py.runPython(code);
    
    // Capture outputs
    const outputs = py.runPython(`
result = []
result.extend(sys.stdout.outputs)
result.extend(sys.stderr.outputs)
result
    `);
    
    // Emit outputs
    for (const [type, text] of outputs) {
      const lines = text.split('\n');
      for (const line of lines) {
        if (line) onLine(type as LineType, line);
      }
    }
    
    onLine('sys', `Exit 0 · ${ms()}ms`);
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
