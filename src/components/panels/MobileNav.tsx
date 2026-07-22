import { useIDEStore } from '../../store/ideStore';
import { Play, Square, Terminal, Code, Folder } from 'lucide-react';
import { motion } from 'framer-motion';

export function MobileNav({ onRun, onStop }: { onRun: () => void; onStop: () => void }) {
  const { isRunning, bottomTab, setBottomTab, setMobileSidebar, mobileView, setMobileView } = useIDEStore();

  return (
    <div className="flex items-center justify-between border-t border-cv-border bg-cv-surface px-4 py-2 md:hidden">
      <button onClick={() => setMobileSidebar(true)} className="cv-icon-btn">
        <Folder size={20} />
      </button>
      <button
        onClick={() => setMobileView('editor')}
        className={`cv-icon-btn ${mobileView === 'editor' ? 'text-cv-accent' : ''}`}
      >
        <Code size={20} />
      </button>
      {isRunning ? (
        <motion.button
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          onClick={onStop}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-cv-error text-white"
        >
          <Square size={18} fill="currentColor" />
        </motion.button>
      ) : (
        <motion.button
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          onClick={onRun}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-cv-success text-white shadow-lg"
        >
          <Play size={18} fill="currentColor" />
        </motion.button>
      )}
      <button
        onClick={() => setBottomTab(bottomTab === 'terminal' ? null : 'terminal')}
        className={`cv-icon-btn ${bottomTab === 'terminal' ? 'text-cv-accent' : ''}`}
      >
        <Terminal size={20} />
      </button>
    </div>
  );
}
