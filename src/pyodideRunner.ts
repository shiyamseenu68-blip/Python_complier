/**
 * pyodideRunner.ts — Browser-based Python execution using Pyodide (WebAssembly)
 * 
 * This replaces the WebSocket backend with client-side Python execution
 * that works on Vercel and any static hosting platform.
 */

import { loadPyodide } from 'pyodide';

export type LineType = 'out' | 'err' | 'sys' | 'in';
export interface RunResult { ok: boolean; ms: number; }
export interface RunSignal { aborted: boolean; }

// Global Pyodide instance (singleton)
let pyodideInstance: any = null;
let isLoading = false;
let loadPromise: Promise<any> | null = null;

/**
 * Initialize Pyodide (lazy loading)
 */
async function initPyodide(): Promise<any> {
  if (pyodideInstance) return pyodideInstance;
  if (isLoading && loadPromise) return loadPromise;

  isLoading = true;
  loadPromise = (async () => {
    try {
      pyodideInstance = await loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
      });
      
      // Set up stdout/stderr redirection
      pyodideInstance.runPython(`
import sys
from io import StringIO

class OutputCapture:
    def __init__(self):
        self.outputs = []
    def write(self, text):
        self.outputs.append(text)
    def flush(self):
        pass
    def get_output(self):
        return ''.join(self.outputs)
    def clear(self):
        self.outputs = []

stdout_capture = OutputCapture()
stderr_capture = OutputCapture()

def redirect_output():
    sys.stdout = stdout_capture
    sys.stderr = stderr_capture

def restore_output():
    sys.stdout = sys.__stdout__
    sys.stderr = sys.__stderr__

def get_stdout():
    return stdout_capture.get_output()

def get_stderr():
    return stderr_capture.get_output()

def clear_output():
    stdout_capture.clear()
    stderr_capture.clear()
      `);
      
      return pyodideInstance;
    } catch (error) {
      console.error('Failed to load Pyodide:', error);
      throw error;
    } finally {
      isLoading = false;
    }
  })();

  return loadPromise;
}

/**
 * Run Python code using Pyodide
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
    // Initialize Pyodide
    onLine('sys', 'Loading Python runtime...');
    const pyodide = await initPyodide();
    
    if (signal.aborted) return { ok: false, ms: ms() };
    
    onLine('sys', 'Python runtime loaded. Executing...');

    // Clear previous output
    pyodide.runPython('clear_output()');
    pyodide.runPython('redirect_output()');

    // Handle input() by overriding it
    pyodide.runPython(`
import builtins
_original_input = builtins.input
_input_prompt = ""
_input_callback = None

def custom_input(prompt=""):
    global _input_prompt
    _input_prompt = prompt
    # This will be handled by JavaScript
    raise InputRequestException(prompt)

builtins.input = custom_input

class InputRequestException(Exception):
    pass
    `);

    // Set up input callback
    let inputCallback: ((value: string) => void) | null = null;
    let inputPrompt = '';

    try {
      // Try to execute the code
      const result = await pyodide.runPythonAsync(code);
      
      // Get captured output
      const stdout = pyodide.runPython('get_stdout()');
      const stderr = pyodide.runPython('get_stderr()');
      
      // Output stdout line by line
      if (stdout) {
        const lines = stdout.split('\n');
        for (const line of lines) {
          if (line) onLine('out', line);
        }
      }
      
      // Output stderr line by line
      if (stderr) {
        const lines = stderr.split('\n');
        for (const line of lines) {
          if (line) onLine('err', line);
        }
      }
      
      // Output result if it's not None
      if (result !== undefined && result !== null) {
        const resultStr = String(result);
        if (resultStr && resultStr !== 'None') {
          onLine('out', resultStr);
        }
      }
      
      onLine('sys', `Exit 0 · ${ms()}ms`);
      return { ok: true, ms: ms() };
      
    } catch (error: any) {
      const errorMsg = String(error);
      
      // Check if it's an input request
      if (errorMsg.includes('InputRequestException')) {
        const promptMatch = errorMsg.match(/InputRequestException\((.*?)\)/);
        const prompt = promptMatch ? promptMatch[1].replace(/['"]/g, '') : '';
        
        onLine('sys', prompt);
        
        try {
          const inputValue = await onInputRequest(prompt);
          onLine('in', inputValue);
          
          // Continue execution with the input
          pyodide.runPython(`
builtins.input = _original_input
_input_value = """${inputValue.replace(/"/g, '\\"')}"""
          `);
          
          // Re-run with input provided
          const codeWithInput = `
_input_prompt = "${prompt}"
_input_value = """${inputValue.replace(/"/g, '\\"')}"""
${code}
          `;
          
          const result = await pyodide.runPythonAsync(codeWithInput);
          
          const stdout = pyodide.runPython('get_stdout()');
          const stderr = pyodide.runPython('get_stderr()');
          
          if (stdout) {
            const lines = stdout.split('\n');
            for (const line of lines) {
              if (line) onLine('out', line);
            }
          }
          
          if (stderr) {
            const lines = stderr.split('\n');
            for (const line of lines) {
              if (line) onLine('err', line);
            }
          }
          
          if (result !== undefined && result !== null) {
            const resultStr = String(result);
            if (resultStr && resultStr !== 'None') {
              onLine('out', resultStr);
            }
          }
          
          onLine('sys', `Exit 0 · ${ms()}ms`);
          return { ok: true, ms: ms() };
          
        } catch (inputError: any) {
          onLine('err', String(inputError));
          onLine('sys', `Exit 1 · ${ms()}ms`);
          return { ok: false, ms: ms() };
        }
      }
      
      // Regular error
      onLine('err', errorMsg);
      onLine('sys', `Exit 1 · ${ms()}ms`);
      return { ok: false, ms: ms() };
    }
    
  } catch (error: any) {
    onLine('err', `Runtime error: ${String(error)}`);
    onLine('sys', `Exit 1 · ${ms()}ms`);
    return { ok: false, ms: ms() };
  } finally {
    // Restore output
    if (pyodideInstance) {
      try {
        pyodideInstance.runPython('restore_output()');
      } catch (e) {
        // Ignore
      }
    }
  }
}

/**
 * Stop execution (not fully supported in Pyodide, but we can abort future operations)
 */
export function stopExecution(signal: RunSignal) {
  signal.aborted = true;
  // Pyodide doesn't support true cancellation, but this flag will prevent further operations
}
