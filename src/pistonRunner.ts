/**
 * pistonRunner.ts — Python execution using Piston API with fallbacks
 * 
 * Try multiple Piston instances to avoid rate limiting and auth issues.
 */

export type LineType = 'out' | 'err' | 'sys' | 'in';
export interface RunResult { ok: boolean; ms: number; }
export interface RunSignal { aborted: boolean; }

const PISTON_ENDPOINTS = [
  'https://emkc.org/api/v2/piston/execute',
  'https://piston.emkc.org/api/v2/piston/execute',
  'https://api.piston-js.org/v2/piston/execute',
];

export async function runPython(opts: {
  code: string;
  onLine: (type: LineType, text: string) => void;
  onInputRequest: (prompt: string) => Promise<string>;
  signal: RunSignal;
}): Promise<RunResult> {
  const { code, onLine, signal } = opts;
  const t0 = performance.now();
  const ms = () => Math.round(performance.now() - t0);

  let lastError: Error | null = null;

  for (const endpoint of PISTON_ENDPOINTS) {
    try {
      if (signal.aborted) return { ok: false, ms: 0 };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: 'python',
          version: '3.10.0',
          files: [
            {
              name: 'main.py',
              content: code,
            },
          ],
        }),
      });

      if (!response.ok) {
        lastError = new Error(`Piston API error (${endpoint}): ${response.statusText}`);
        continue;
      }

      const result = await response.json();

      // Output stdout
      if (result.run?.stdout) {
        const lines = result.run.stdout.split('\n');
        for (const line of lines) {
          if (line) onLine('out', line);
        }
      }

      // Output stderr
      if (result.run?.stderr) {
        const lines = result.run.stderr.split('\n');
        for (const line of lines) {
          if (line) onLine('err', line);
        }
      }

      const exitCode = result.run?.exitCode || 0;
      onLine('sys', `Exit ${exitCode} · ${ms()}ms`);

      return { ok: exitCode === 0, ms: ms() };
      
    } catch (e: any) {
      lastError = e;
      continue;
    }
  }

  // All endpoints failed
  onLine('err', lastError?.message || 'All Piston endpoints failed');
  onLine('sys', `Exit 1 · ${ms()}ms`);
  return { ok: false, ms: ms() };
}

export function stopExecution(signal: RunSignal) {
  signal.aborted = true;
}
