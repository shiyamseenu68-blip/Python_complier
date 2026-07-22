export type OutputType = 'stdout' | 'stderr' | 'system' | 'input';

export interface RunResult {
  exitCode: number;
  executionTime: number;
  error?: string;
}

let pyodideInstance: any = null;
let pyodideLoading: Promise<any> | null = null;

async function getPyodide(onOutput: (type: OutputType, msg: string) => void): Promise<any> {
  if (pyodideInstance) return pyodideInstance;
  if (pyodideLoading) return pyodideLoading;

  pyodideLoading = (async () => {
    onOutput('system', 'Loading Python 3 runtime...');

    // Remove any stale script tag
    document.querySelectorAll('script[data-pyodide]').forEach(el => el.remove());

    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js';
      script.setAttribute('data-pyodide', '1');
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Pyodide script'));
      document.head.appendChild(script);
    });

    const pyodide = await (window as any).loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/',
    });

    pyodideInstance = pyodide;
    onOutput('system', 'Python 3 ready.');
    return pyodide;
  })().catch(err => {
    pyodideLoading = null;
    throw err;
  });

  return pyodideLoading;
}

export async function runPython(
  code: string,
  onOutput: (type: OutputType, msg: string) => void,
  requestInput: (prompt: string) => Promise<string>,
  isAborted: () => boolean,
): Promise<RunResult> {
  const t0 = performance.now();

  let pyodide: any;
  try {
    pyodide = await getPyodide(onOutput);
  } catch (e: any) {
    onOutput('stderr', `Failed to load Python runtime: ${e.message}`);
    return { exitCode: 1, executionTime: performance.now() - t0, error: e.message };
  }

  // Accumulate stdout/stderr to flush line-by-line
  let stdoutBuf = '';
  let stderrBuf = '';

  const flushLine = (buf: string, type: OutputType, remaining: string): string => {
    const lines = (buf + remaining).split('\n');
    for (let i = 0; i < lines.length - 1; i++) {
      onOutput(type, lines[i]);
    }
    return lines[lines.length - 1]; // partial line remains
  };

  pyodide.setStdout({
    write: (s: string) => {
      stdoutBuf += s;
      const idx = stdoutBuf.lastIndexOf('\n');
      if (idx !== -1) {
        stdoutBuf = flushLine('', 'stdout', stdoutBuf.slice(0, idx + 1));
        stdoutBuf = stdoutBuf.slice(idx + 1);
      }
    },
    isatty: false,
  });

  pyodide.setStderr({
    write: (s: string) => {
      stderrBuf += s;
      const idx = stderrBuf.lastIndexOf('\n');
      if (idx !== -1) {
        stderrBuf = flushLine('', 'stderr', stderrBuf.slice(0, idx + 1));
        stderrBuf = stderrBuf.slice(idx + 1);
      }
    },
    isatty: false,
  });

  // Register async input bridge — Pyodide cannot truly await JS Promises in sync Python,
  // so we use a synchronous approach: store the resolver on a well-known global and
  // have Python call a JS function that schedules an async operation, but since Python
  // runPythonAsync uses an async event loop we can use a proper async bridge.
  const inputBridge = async (prompt: string): Promise<string> => {
    if (isAborted()) return '';
    // Flush any buffered prompt text already printed to stdout
    if (stdoutBuf) {
      onOutput('stdout', stdoutBuf);
      stdoutBuf = '';
    }
    return requestInput(prompt);
  };
  pyodide.globals.set('__js_input__', inputBridge);

  // Install the input() override and run the user code
  const bootstrap = `
import sys
import builtins
import asyncio
from pyodide.ffi import to_js

async def _async_input(prompt=""):
    if prompt:
        import sys
        sys.stdout.write(str(prompt))
        sys.stdout.flush()
    result = await __js_input__(str(prompt) if prompt else "")
    return str(result) if result is not None else ""

def _sync_input(prompt=""):
    # synchronous fallback — should not normally be called
    if prompt:
        import sys
        sys.stdout.write(str(prompt))
        sys.stdout.flush()
    return ""

builtins.input = _async_input
`;

  try {
    await pyodide.runPythonAsync(bootstrap);
  } catch (e: any) {
    onOutput('stderr', `Bootstrap error: ${e.message}`);
    return { exitCode: 1, executionTime: performance.now() - t0, error: e.message };
  }

  let exitCode = 0;
  let errorMsg: string | undefined;

  try {
    if (isAborted()) throw new Error('Aborted');
    await pyodide.runPythonAsync(code);
  } catch (e: any) {
    exitCode = 1;
    errorMsg = (e.message ?? String(e)) as string;
    if (!errorMsg.includes('Aborted')) {
      // Format as proper Python traceback
      const formatted = errorMsg
        .split('\n')
        .filter((l: string) => l.trim())
        .join('\n');
      onOutput('stderr', formatted);
    }
  }

  // Flush any remaining buffered output
  if (stdoutBuf.trim()) onOutput('stdout', stdoutBuf);
  if (stderrBuf.trim()) onOutput('stderr', stderrBuf);

  const elapsed = performance.now() - t0;
  onOutput('system', `Process exited with code ${exitCode} in ${elapsed.toFixed(0)}ms`);
  return { exitCode, executionTime: elapsed, error: errorMsg };
}

export function resetRuntime() {
  pyodideInstance = null;
  pyodideLoading = null;
}
