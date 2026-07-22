import { useIDEStore } from '../../store/ideStore';
import { Play, Square, Settings, PanelLeft, Command, PanelBottom, Download, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function TopBar({ onRun, onStop, onExport }: { onRun: () => void; onStop: () => void; onExport: () => void }) {
  const { isRunning, setSettingsOpen, setCommandPalette, toggleSidebar, setBottomTab, bottomTab, getActiveFile, setZenMode, zoomIn, zoomOut } = useIDEStore();
  const file = getActiveFile();

  return (
    <div className="flex h-12 items-center justify-between border-b border-cv-border bg-cv-bg/80 px-3 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <button onClick={toggleSidebar} className="cv-icon-btn" title="Toggle Sidebar">
          <PanelLeft size={16} />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cv-accent to-purple-500 text-xs font-bold text-white shadow-lg">
            PY
          </div>
          <span className="text-sm font-semibold text-cv-text">Python Studio</span>
        </div>
        {file && (
          <span className="ml-2 hidden text-xs text-cv-muted sm:inline">{file.name}</span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <div className="hidden items-center gap-0.5 rounded-lg border border-cv-border bg-cv-surface px-1 py-0.5 lg:flex">
          <button onClick={zoomOut} className="cv-icon-btn !p-1" title="Zoom Out (Ctrl+-)"><ZoomOut size={13} /></button>
          <button onClick={zoomIn} className="cv-icon-btn !p-1" title="Zoom In (Ctrl+=)"><ZoomIn size={13} /></button>
        </div>

        <button
          onClick={() => setCommandPalette(true)}
          className="hidden items-center gap-2 rounded-lg border border-cv-border bg-cv-surface px-3 py-1.5 text-xs text-cv-muted transition-colors hover:bg-cv-elevated hover:text-cv-text sm:flex"
        >
          <Command size={12} />
          <span>Search...</span>
          <kbd className="rounded bg-cv-elevated px-1.5 py-0.5 text-[10px]">⌘K</kbd>
        </button>
        <button onClick={() => setCommandPalette(true)} className="cv-icon-btn sm:hidden">
          <Command size={16} />
        </button>

        <button onClick={onExport} className="cv-icon-btn" title="Export / File Management (Ctrl+E)">
          <Download size={16} />
        </button>
        <button
          onClick={() => setBottomTab(bottomTab === 'terminal' ? null : 'terminal')}
          className="cv-icon-btn hidden md:flex"
          title="Toggle Terminal"
        >
          <PanelBottom size={16} />
        </button>
        <button onClick={() => setZenMode(true)} className="cv-icon-btn hidden md:flex" title="Zen Mode">
          <Maximize2 size={16} />
        </button>
        <button onClick={() => setSettingsOpen(true)} className="cv-icon-btn" title="Settings">
          <Settings size={16} />
        </button>

        {isRunning ? (
          <motion.button
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            onClick={onStop}
            className="flex items-center gap-1.5 rounded-lg bg-cv-error px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-600"
          >
            <Square size={13} fill="currentColor" /> Stop
          </motion.button>
        ) : (
          <motion.button
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            onClick={onRun}
            className="flex items-center gap-1.5 rounded-lg bg-cv-success px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-600"
          >
            <Play size={13} fill="currentColor" /> Run
          </motion.button>
        )}
      </div>
    </div>
  );
}
