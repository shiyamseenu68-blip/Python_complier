/**
 * apiRunner.ts — Python execution using multiple API services with fallbacks
 * 
 * Try multiple free Python execution APIs to find one that works.
 */

export type LineType = 'out' | 'err' | 'sys' | 'in';
export interface RunResult { ok: boolean; ms: number; }
export interface RunSignal { aborted: boolean; }

const API_SERVICES = [
  {
    name: 'Rextester',
    execute: async (code: string) => {
      const formData = new URLSearchParams();
      formData.append('LanguageChoice', '71'); // Python 3
      formData.append('Program', code);
      formData.append('Input', '');
      formData.append('CompilerArgs', '');
      
      const response = await fetch('https://rextester.com/rundotnet/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      });
      const result = await response.json();
      return {
        stdout: result.Result || '',
        stderr: result.Errors || '',
        exitCode: result.Errors ? 1 : 0,
      };
    },
  },
  {
    name: 'Piston',
    execute: async (code: string) => {
      const endpoints = [
        'https://emkc.org/api/v2/piston/execute',
        'https://piston.emkc.org/api/v2/piston/execute',
        'https://api.piston-js.org/v2/piston/execute',
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              language: 'python',
              version: '3.10.0',
              files: [{ name: 'main.py', content: code }],
            }),
          });
          if (response.ok) {
            const result = await response.json();
            return {
              stdout: result.run?.stdout || '',
              stderr: result.run?.stderr || '',
              exitCode: result.run?.exitCode || 0,
            };
          }
        } catch (e) {
          continue;
        }
      }
      throw new Error('All Piston endpoints failed');
    },
  },
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

  for (const service of API_SERVICES) {
    try {
      if (signal.aborted) return { ok: false, ms: 0 };

      const result = await service.execute(code);

      // Output stdout
      if (result.stdout) {
        const lines = result.stdout.split('\n');
        for (const line of lines) {
          if (line) onLine('out', line);
        }
      }

      // Output stderr
      if (result.stderr) {
        const lines = result.stderr.split('\n');
        for (const line of lines) {
          if (line) onLine('err', line);
        }
      }

      const exitCode = result.exitCode || 0;
      onLine('sys', `Exit ${exitCode} · ${ms()}ms`);

      return { ok: exitCode === 0, ms: ms() };
      
    } catch (e: any) {
      lastError = new Error(`${service.name} API error: ${e.message}`);
      continue;
    }
  }

  // All services failed
  onLine('err', lastError?.message || 'All Python execution APIs failed');
  onLine('sys', `Exit 1 · ${ms()}ms`);
  return { ok: false, ms: ms() };
}

export function stopExecution(signal: RunSignal) {
  signal.aborted = true;
}
