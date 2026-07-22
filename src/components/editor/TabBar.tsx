import { useIDEStore } from '../../store/ideStore';
import { X, Pin, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab, settings } = useIDEStore();

  if (tabs.length === 0) return null;

  return (
    <div className="flex items-center overflow-x-auto border-b border-cv-border bg-cv-surface no-scrollbar" style={{ height: settings.tabHeight }}>
      <AnimatePresence initial={false}>
        {tabs.map(tab => {
          const active = tab.id === activeTabId;
          return (
            <motion.div
              key={tab.id}
              layout
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              onClick={() => setActiveTab(tab.id)}
              className={`group flex items-center gap-1.5 border-r border-cv-border px-3 py-2 cursor-pointer whitespace-nowrap transition-colors ${
                active ? 'bg-cv-bg text-cv-text' : 'text-cv-muted hover:bg-cv-elevated/50'
              }`}
              style={{ minWidth: 'fit-content' }}
            >
              {tab.isPinned && <Pin size={10} className="text-cv-muted" />}
              <span className={`text-xs ${tab.isDirty ? 'italic' : ''}`}>
                {tab.name}{tab.isDirty ? ' •' : ''}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                className="ml-1 rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/10"
              >
                <X size={12} />
              </button>
              {active && (
                <motion.div
                  layoutId="tab-active-bar"
                  className="absolute bottom-0 left-0 h-0.5 w-full bg-cv-accent"
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
