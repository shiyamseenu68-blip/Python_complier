/**
 * pistonRunner.ts — Real Python execution using Piston API
 * 
 * Piston is a high-performance code execution engine that actually runs
 * Python code on a server. This provides real Python execution, not simulation.
 * 
 * API: https://emkc.org/api/v2/piston/execute
 */

export type LineType = 'out' | 'err' | 'sys' | 'in';
export interface RunResult { ok: boolean; ms: number; }
export interface RunSignal { aborted: boolean; }

const PISTON_API = 'https://emkc.org/api/v2/piston/execute';

/**
 * Run Python code using Piston API (real server-side execution)
 */
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
    if (signal.aborted) return { ok: false, ms: ms() };

    onLine('sys', 'Executing Python code...');

    const response = await fetch(PISTON_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: 'python',
        version: '3.10.0',
        files: [
          {
            content: code
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    // Handle stdout
    if (result.run && result.run.stdout) {
      const lines = result.run.stdout.split('\n');
      for (const line of lines) {
        if (line) onLine('out', line);
      }
    }

    // Handle stderr
    if (result.run && result.run.stderr) {
      const lines = result.run.stderr.split('\n');
      for (const line of lines) {
        if (line) onLine('err', line);
      }
    }

    // Handle compile errors
    if (result.compile && result.compile.stderr) {
      const lines = result.compile.stderr.split('\n');
      for (const line of lines) {
        if (line) onLine('err', line);
      }
    }

    const exitCode = result.run?.exit_code ?? 1;
    const success = exitCode === 0;

    onLine('sys', `Exit ${exitCode} · ${ms()}ms`);
    return { ok: success, ms: ms() };

  } catch (error: any) {
    onLine('err', `Execution error: ${error.message}`);
    onLine('sys', `Exit 1 · ${ms()}ms`);
    return { ok: false, ms: ms() };
  }
}

/**
 * Stop execution (Piston doesn't support cancellation, but we can abort future requests)
 */
export function stopExecution(signal: RunSignal) {
  signal.aborted = true;
}
