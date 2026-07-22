import { useEffect, useRef, useState } from 'react';
import { useIDEStore } from '../../store/ideStore';
import { Trash2, Terminal as TerminalIcon, ChevronDown, Download, Copy, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TYPE_STYLES: Record<string, { color: string; prefix: string }> = {
  stdout: { color: 'text-cv-text', prefix: '' },
  stderr: { color: 'text-cv-error', prefix: '' },
  info: { color: 'text-cv-accent', prefix: '[INFO] ' },
  error: { color: 'text-cv-error', prefix: '[ERROR] ' },
  system: { color: 'text-cv-muted italic', prefix: '' },
  input: { color: 'text-cv-warning', prefix: '>> ' },
};

export function Terminal() {
  const { outputEntries, clearOutput, isRunning, inputPrompt, submitInput, setBottomTab, bottomTab, settings } = useIDEStore();
  const ref = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' });
  }, [outputEntries, inputPrompt]);

  const downloadOutput = () => {
    const text = outputEntries.map(e => `${e.type}: ${e.message}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'output.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  const copyOutput = () => {
    const text = outputEntries.map(e => e.message).join('\n');
    navigator.clipboard.writeText(text);
  };

  const handleInputSubmit = () => {
    if (inputPrompt) {
      submitInput(input);
      setHistory(h => [...h, input]);
      setHistIdx(-1);
      setInput('');
    }
  };

  return (
    <div className="flex h-full flex-col bg-cv-surface">
      <div className="flex items-center justify-between border-b border-cv-border px-3 py-1.5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setBottomTab('terminal')}
            className={`flex items-center gap-1.5 text-xs font-medium ${bottomTab === 'terminal' ? 'text-cv-text' : 'text-cv-muted hover:text-cv-text'}`}
          >
            <TerminalIcon size={13} /> Terminal
          </button>
          {isRunning && (
            <span className="flex items-center gap-1 text-[10px] text-cv-success">
              <Circle size={6} className="animate-pulse fill-current" /> running
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={copyOutput} className="cv-icon-btn" title="Copy"><Copy size={13} /></button>
          <button onClick={downloadOutput} className="cv-icon-btn" title="Download"><Download size={13} /></button>
          <button onClick={clearOutput} className="cv-icon-btn" title="Clear"><Trash2 size={13} /></button>
          <button onClick={() => setBottomTab(null)} className="cv-icon-btn" title="Hide"><ChevronDown size={13} /></button>
        </div>
      </div>

      <div ref={ref} className="flex-1 overflow-y-auto px-3 py-2 font-mono text-xs" style={{ fontFamily: `'${settings.terminalFont}', monospace`, fontSize: `${settings.terminalFontSize}px`, opacity: settings.terminalTransparency / 100 }}>
        {outputEntries.length === 0 && !inputPrompt && (
          <div className="flex h-full flex-col items-center justify-center text-cv-muted/50">
            <TerminalIcon size={24} className="mb-2 opacity-40" />
            <p>Terminal output will appear here</p>
            <p className="mt-1 text-[10px]">Press Run to execute your Python code</p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {outputEntries.map(entry => {
            const style = TYPE_STYLES[entry.type] ?? { color: 'text-cv-text', prefix: '' };
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`whitespace-pre-wrap break-words ${style.color}`}
              >
                {style.prefix}{entry.message}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {inputPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-1 flex items-center gap-2"
          >
            <span className="text-cv-warning">{'>>'}</span>
            <input
              autoFocus
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleInputSubmit();
                if (e.key === 'ArrowUp') { const h = history; if (h.length > 0) { const idx = histIdx === -1 ? h.length - 1 : Math.max(0, histIdx - 1); setHistIdx(idx); setInput(h[idx]); } }
                if (e.key === 'ArrowDown') { if (histIdx !== -1 && histIdx < history.length - 1) { const idx = histIdx + 1; setHistIdx(idx); setInput(history[idx]); } else { setHistIdx(-1); setInput(''); } }
              }}
              className="flex-1 bg-transparent text-cv-text outline-none font-mono text-xs"
              placeholder={inputPrompt || 'Type input and press Enter...'}
            />
          </motion.div>
        )}

        {!inputPrompt && (
          <div className="mt-1 flex items-center gap-2">
            <span className="text-cv-success">{'>>'}</span>
            <span className="text-cv-muted/40 text-xs">Ready</span>
          </div>
        )}
      </div>
    </div>
  );
}
