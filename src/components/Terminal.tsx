import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { Trash2, Copy, ChevronDown, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LINE_CLS: Record<string, string> = {
  out: 'text-cv-text',
  err: 'text-red-400',
  sys: 'text-cv-muted italic text-[11px]',
  in:  'text-yellow-300',
};

export function Terminal() {
  const { lines, clearLines, running, inputPrompt, resolveInput, cfg, setTermOpen } = useStore();
  const endRef = useRef<HTMLDivElement>(null);
  const inRef  = useRef<HTMLInputElement>(null);
  const [val, setVal] = useState('');

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [lines, inputPrompt]);
  useEffect(() => { if (inputPrompt !== null) setTimeout(() => inRef.current?.focus(), 30); }, [inputPrompt]);

  const submit = () => { const v = val; setVal(''); resolveInput(v); };

  return (
    <div className="flex h-full flex-col" style={{ background: 'var(--cv-surface)' }}>
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-cv-border px-3 py-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-cv-text">Terminal</span>
          {running && (
            <span className="flex items-center gap-1 text-[10px] text-cv-success">
              <Loader2 size={9} className="animate-spin" /> running
            </span>
          )}
          {!running && inputPrompt !== null && (
            <span className="text-[10px] text-yellow-400">waiting for input</span>
          )}
        </div>
        <div className="flex gap-0.5">
          <button
            onClick={() => navigator.clipboard.writeText(lines.map(l => l.text).join('\n'))}
            className="ib"><Copy size={11} /></button>
          <button onClick={clearLines} className="ib"><Trash2 size={11} /></button>
          <button onClick={() => setTermOpen(false)} className="ib"><ChevronDown size={11} /></button>
        </div>
      </div>

      {/* Output area */}
      <div
        className="flex-1 overflow-y-auto px-3 py-2"
        style={{ fontFamily: `'${cfg.font}','JetBrains Mono',monospace`, fontSize: cfg.termFont }}>

        {lines.length === 0 && inputPrompt === null && !running && (
          <p className="mt-8 text-center text-xs text-cv-muted opacity-40">
            Press Ctrl+Enter to run
          </p>
        )}

        <AnimatePresence initial={false}>
          {lines.map(l => (
            <motion.div
              key={l.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`whitespace-pre-wrap break-all leading-relaxed ${LINE_CLS[l.type] ?? 'text-cv-text'}`}>
              {l.text}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Input field — shown when Python is waiting for input() */}
        {inputPrompt !== null && (
          <div className="mt-0.5 flex items-center">
            <input
              ref={inRef}
              value={val}
              onChange={e => setVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
              className="min-w-0 flex-1 bg-transparent text-yellow-300 caret-yellow-300 outline-none"
              style={{ fontFamily: `'${cfg.font}',monospace`, fontSize: cfg.termFont }}
              autoComplete="off"
              spellCheck={false}
              placeholder="type and press Enter…"
            />
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
