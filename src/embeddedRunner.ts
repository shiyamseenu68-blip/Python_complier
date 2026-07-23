/**
 * embeddedRunner.ts — Python execution using embedded JavaScript interpreter
 * 
 * Uses a JavaScript-based Python interpreter that runs entirely in the browser.
 * No external dependencies, no CDN loading, works on Vercel.
 * Supports basic Python syntax: print, variables, arithmetic, strings, loops, conditionals.
 */

export type LineType = 'out' | 'err' | 'sys' | 'in';
export interface RunResult { ok: boolean; ms: number; }
export interface RunSignal { aborted: boolean; }

class SimplePythonInterpreter {
  private variables: Map<string, any> = new Map();
  private output: string[] = [];

  execute(code: string): { output: string; error: string | null } {
    this.output = [];
    this.variables.clear();
    
    try {
      // Preprocess code
      const processedCode = this.preprocessCode(code);
      
      // Execute using JavaScript eval with Python-like syntax
      this.executeLines(processedCode);
      
      return { output: this.output.join('\n'), error: null };
    } catch (e: any) {
      return { output: '', error: e.message };
    }
  }

  private preprocessCode(code: string): string[] {
    const lines: string[] = [];
    const codeLines = code.split('\n');
    let i = 0;
    
    while (i < codeLines.length) {
      let line = codeLines[i].trim();
      
      // Skip empty lines and comments
      if (!line || line.startsWith('#')) {
        i++;
        continue;
      }
      
      // Handle multi-line structures
      if (line.endsWith(':')) {
        const block = this.extractBlock(codeLines, i);
        lines.push(...block);
        i += block.length;
      } else {
        lines.push(line);
        i++;
      }
    }
    
    return lines;
  }

  private extractBlock(lines: string[], startIndex: number): string[] {
    const block: string[] = [];
    const indentLevel = lines[startIndex].length - lines[startIndex].trimStart().length;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      const lineIndent = line.length - line.trimStart().length;
      
      block.push(line);
      
      if (i > startIndex && lineIndent <= indentLevel && line.trim()) {
        break;
      }
    }
    
    return block;
  }

  private executeLines(lines: string[]): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('#')) continue;
      
      // Handle print statements
      const printMatch = line.match(/^print\s*\((.+)\)$/);
      if (printMatch) {
        const expr = printMatch[1].trim();
        const value = this.evaluateExpression(expr);
        this.output.push(String(value));
        continue;
      }
      
      // Handle variable assignment
      const assignMatch = line.match(/^(\w+)\s*=\s*(.+)$/);
      if (assignMatch) {
        const varName = assignMatch[1];
        const expr = assignMatch[2].trim();
        const value = this.evaluateExpression(expr);
        this.variables.set(varName, value);
        continue;
      }
      
      // Handle if statements
      const ifMatch = line.match(/^if\s+(.+):$/);
      if (ifMatch) {
        const condition = this.evaluateExpression(ifMatch[1]);
        if (condition) {
          // Execute the block
          const block = this.getBlockLines(lines, i);
          this.executeLines(block);
          i += block.length;
        } else {
          // Skip the block
          const block = this.getBlockLines(lines, i);
          i += block.length;
        }
        continue;
      }
      
      // Handle for loops
      const forMatch = line.match(/^for\s+(\w+)\s+in\s+range\((.+)\):$/);
      if (forMatch) {
        const varName = forMatch[1];
        const rangeArgs = this.parseRangeArgs(forMatch[2]);
        
        for (let j = rangeArgs[0]; j < rangeArgs[1]; j++) {
          this.variables.set(varName, j);
          const block = this.getBlockLines(lines, i);
          this.executeLines(block);
        }
        
        i += this.getBlockLines(lines, i).length;
        continue;
      }
      
      // Handle while loops
      const whileMatch = line.match(/^while\s+(.+):$/);
      if (whileMatch) {
        const block = this.getBlockLines(lines, i);
        while (this.evaluateExpression(whileMatch[1])) {
          this.executeLines(block);
        }
        i += block.length;
        continue;
      }
    }
  }

  private getBlockLines(lines: string[], startIndex: number): string[] {
    const block: string[] = [];
    const baseIndent = lines[startIndex].length - lines[startIndex].trimStart().length;
    
    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      const indent = line.length - line.trimStart().length;
      
      if (line.trim() && indent <= baseIndent) {
        break;
      }
      
      block.push(line);
    }
    
    return block;
  }

  private parseRangeArgs(args: string): number[] {
    const parts = args.split(',').map(p => p.trim());
    if (parts.length === 1) {
      return [0, this.evaluateExpression(parts[0])];
    } else if (parts.length === 2) {
      return [this.evaluateExpression(parts[0]), this.evaluateExpression(parts[1])];
    }
    return [0, 0];
  }

  private evaluateExpression(expr: string): any {
    expr = expr.trim();
    
    // Handle strings
    if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
      return expr.slice(1, -1);
    }
    
    // Handle numbers
    if (!isNaN(Number(expr))) {
      return Number(expr);
    }
    
    // Handle booleans
    if (expr === 'True') return true;
    if (expr === 'False') return false;
    
    // Handle variables
    if (this.variables.has(expr)) {
      return this.variables.get(expr);
    }
    
    // Handle simple arithmetic
    const arithmeticMatch = expr.match(/^(\d+)\s*([+\-*/])\s*(\d+)$/);
    if (arithmeticMatch) {
      const a = Number(arithmeticMatch[1]);
      const op = arithmeticMatch[2];
      const b = Number(arithmeticMatch[3]);
      switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return a / b;
      }
    }
    
    // Handle comparisons
    const comparisonMatch = expr.match(/^(.+)\s*(==|!=|<|>|<=|>=)\s*(.+)$/);
    if (comparisonMatch) {
      const a = this.evaluateExpression(comparisonMatch[1]);
      const op = comparisonMatch[2];
      const b = this.evaluateExpression(comparisonMatch[3]);
      switch (op) {
        case '==': return a === b;
        case '!=': return a !== b;
        case '<': return a < b;
        case '>': return a > b;
        case '<=': return a <= b;
        case '>=': return a >= b;
      }
    }
    
    // Handle string concatenation
    const concatMatch = expr.match(/^["'](.+)["']\s*\+\s*["'](.+)["']$/);
    if (concatMatch) {
      return concatMatch[1] + concatMatch[2];
    }
    
    return expr;
  }
}

export async function runPython(opts: {
  code: string;
  onLine: (type: LineType, text: string) => void;
  onInputRequest: (prompt: string) => Promise<string>;
  signal: RunSignal;
}): Promise<RunResult> {
  const { code, onLine, signal } = opts;
  const t0 = performance.now();
  const ms = () => Math.round(performance.now() - t0);

  try {
    if (signal.aborted) return { ok: false, ms: 0 };

    const interpreter = new SimplePythonInterpreter();
    const result = interpreter.execute(code);

    if (result.error) {
      onLine('err', result.error);
      onLine('sys', `Exit 1 · ${ms()}ms`);
      return { ok: false, ms: ms() };
    }

    if (result.output) {
      const lines = result.output.split('\n');
      for (const line of lines) {
        if (line) onLine('out', line);
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
