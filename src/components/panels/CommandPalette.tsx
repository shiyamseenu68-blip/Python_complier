import { useIDEStore } from '../../store/ideStore';
import { Search, CornerDownLeft } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CommandItem } from '../../types';

export function CommandPalette({ commands }: { commands: CommandItem[] }) {
  const { showCommandPalette, setCommandPalette } = useIDEStore();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showCommandPalette) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [showCommandPalette]);

  if (!showCommandPalette) return null;

  const filtered = commands.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  const execute = (cmd: CommandItem) => {
    cmd.action();
    setCommandPalette(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm"
        onClick={() => setCommandPalette(false)}
      >
        <motion.div
          initial={{ scale: 0.96, y: -10, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.96, y: -10, opacity: 0 }}
          className="w-[600px] max-w-[95vw] overflow-hidden rounded-xl border border-cv-border bg-cv-surface shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 border-b border-cv-border px-4 py-3">
            <Search size={16} className="text-cv-muted" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setSelected(0); }}
              onKeyDown={e => {
                if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); }
                if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
                if (e.key === 'Enter' && filtered[selected]) { e.preventDefault(); execute(filtered[selected]); }
                if (e.key === 'Escape') setCommandPalette(false);
              }}
              placeholder="Type a command..."
              className="flex-1 bg-transparent text-sm text-cv-text outline-none placeholder:text-cv-muted"
            />
            <kbd className="rounded bg-cv-elevated px-1.5 py-0.5 text-[10px] text-cv-muted">ESC</kbd>
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
            {filtered.length === 0 && (
              <div className="px-3 py-8 text-center text-sm text-cv-muted">No commands found</div>
            )}
            {filtered.map((cmd, i) => (
              <button
                key={cmd.id}
                onClick={() => execute(cmd)}
                onMouseEnter={() => setSelected(i)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors ${i === selected ? 'bg-cv-accent/15' : 'hover:bg-cv-elevated/50'}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-cv-muted">{cmd.category}</span>
                  <span className="text-sm text-cv-text">{cmd.label}</span>
                </div>
                {cmd.shortcut && (
                  <kbd className="rounded bg-cv-elevated px-1.5 py-0.5 text-[10px] text-cv-muted">{cmd.shortcut}</kbd>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 border-t border-cv-border px-4 py-2 text-[10px] text-cv-muted">
            <CornerDownLeft size={10} /> to select
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
