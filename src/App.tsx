import { useEffect, useMemo, useRef } from 'react';
import { useStore } from './store';
import { getTheme } from './themes';
import { runPython, stopExecution } from './embeddedRunner';
import { CodeEditor }     from './components/CodeEditor';
import { Terminal }       from './components/Terminal';
import { Sidebar }        from './components/Sidebar';
import { TopBar }         from './components/TopBar';
import { Tabs }           from './components/Tabs';
import { StatusBar }      from './components/StatusBar';
import { Notifications }  from './components/Notifications';
import { SettingsModal }  from './components/SettingsModal';
import { CommandPalette } from './components/CommandPalette';
import { ExportModal }    from './components/ExportModal';
import { SnippetsPanel, HistoryPanel } from './components/DbPanels';
import { Play, Terminal as TermIcon, Folder, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

export function App() {
  const store = useStore();
  const { files, cfg, running, setRunning, addLine, clearLines, notify, setTermOpen,
    termOpen, termH, setTermH, sidebarOpen, sidebarW, setSidebarW,
    mobileView, setMobileView, mobileNav, setMobileNav,
    saveAll, activeFile, openFile, requestInput, zoomIn, zoomOut, resetZoom,
    setShowCmd, setShowCfg, setShowExport, setShowHistory, setShowSnippets,
    runSignal, loadDb, recordRun } = store;
  const theme = getTheme(cfg.theme || 'tokyo-night');
  const runOut = useRef<{ out: string[]; err: string[]; inputs: string[] }>({ out: [], err: [], inputs: [] });

  // Apply theme CSS variables
  useEffect(() => {
    const s = document.documentElement.style;
    s.setProperty('--cv-bg',      theme.bg);
    s.setProperty('--cv-surface', theme.surface);
    s.setProperty('--cv-elevated',theme.elevated);
    s.setProperty('--cv-border',  theme.border);
    s.setProperty('--cv-text',    theme.text);
    s.setProperty('--cv-muted',   theme.muted);
    s.setProperty('--cv-accent',  cfg.accent || theme.accent);
    s.setProperty('--cv-success', theme.success);
    s.setProperty('--cv-warning', theme.warning);
    s.setProperty('--cv-error',   theme.error);
    document.body.style.background = theme.bg;
    document.body.style.color      = theme.text;
  }, [theme, cfg.accent]);

  useEffect(() => {
    if (files.length > 0 && store.tabs.length === 0) openFile(files[0].id);
    loadDb();
  }, []);

  const run = async () => {
    if (running) return;
    const file = activeFile();
    if (!file) { notify({ level: 'warning', title: 'No file open' }); return; }
    if (file.language !== 'python') {
      notify({ level: 'warning', title: 'Only .py files run', msg: file.name });
      return;
    }
    clearLines();
    setRunning(true);
    setTermOpen(true);
    runSignal.aborted = false;
    runSignal._ws     = undefined;
    runOut.current    = { out: [], err: [], inputs: [] };

    const t0 = performance.now();
    const result = await runPython({
      code: file.content ?? '',
      onLine: (type, text) => {
        addLine(type, text);
        if (type === 'out') runOut.current.out.push(text);
        if (type === 'err') runOut.current.err.push(text);
      },
      onInputRequest: async (prompt) => {
        const val = await requestInput(prompt);
        runOut.current.inputs.push(val);
        return val;
      },
      signal: runSignal,
    });

    setRunning(false);
    const ms = Math.round(performance.now() - t0);
    if (result.ok) notify({ level: 'success', title: 'Done', msg: `${ms}ms` });

    const { out, err, inputs } = runOut.current;
    recordRun(file.snippetId ?? null, file.content ?? '', inputs, out.join('\n'), result.ok ? 0 : 1, ms, err.join('\n'));
  };

  const stop = () => {
    stopExecution(runSignal);
    store.resolveInput('');
    setRunning(false);
    addLine('sys', 'Stopped.');
    notify({ level: 'info', title: 'Stopped' });
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const m = e.ctrlKey || e.metaKey;
      if (m && e.key === 'Enter') { e.preventDefault(); run(); }
      if (m && e.key === 'k')     { e.preventDefault(); setShowCmd(true); }
      if (m && e.key === 's')     { e.preventDefault(); saveAll(); notify({ level: 'success', title: 'Saved' }); }
      if (m && e.key === 'e')     { e.preventDefault(); setShowExport(true); }
      if (m && (e.key === '=' || e.key === '+')) { e.preventDefault(); zoomIn(); }
      if (m && e.key === '-')     { e.preventDefault(); zoomOut(); }
      if (m && e.key === '0')     { e.preventDefault(); resetZoom(); }
      if (m && e.key === '`')     { e.preventDefault(); setTermOpen(!termOpen); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [termOpen, running]);

  const drag = (setter: (v: number) => void, axis: 'x' | 'y', base: number, invert = false) =>
    (e: React.MouseEvent) => {
      e.preventDefault();
      const start = axis === 'x' ? e.clientX : e.clientY;
      const mv = (ev: MouseEvent) => {
        const delta = (axis === 'x' ? ev.clientX : ev.clientY) - start;
        setter(invert ? base - delta : base + delta);
      };
      const up = () => { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); };
      document.addEventListener('mousemove', mv);
      document.addEventListener('mouseup', up);
    };

  const cmds = useMemo(() => [
    { id:'run',     label:'Run Python',       category:'Run',      shortcut:'Ctrl+Enter', action: run },
    { id:'stop',    label:'Stop',             category:'Run',      action: stop },
    { id:'save',    label:'Save All',         category:'File',     shortcut:'Ctrl+S',     action: () => { saveAll(); notify({ level:'success', title:'Saved' }); } },
    { id:'export',  label:'Export/Import',    category:'File',     shortcut:'Ctrl+E',     action: () => setShowExport(true) },
    { id:'snips',   label:'Snippets',         category:'Database', action: () => setShowSnippets(true) },
    { id:'hist',    label:'Run History',      category:'Database', action: () => setShowHistory(true) },
    { id:'term',    label:'Toggle Terminal',  category:'View',     shortcut:'Ctrl+`',     action: () => setTermOpen(!termOpen) },
    { id:'cfg',     label:'Settings',         category:'View',     action: () => setShowCfg(true) },
    { id:'zi',      label:'Zoom In',          category:'View',     shortcut:'Ctrl+=',     action: zoomIn },
    { id:'zo',      label:'Zoom Out',         category:'View',     shortcut:'Ctrl+-',     action: zoomOut },
    { id:'zr',      label:'Reset Zoom',       category:'View',     shortcut:'Ctrl+0',     action: resetZoom },
    { id:'clr',     label:'Clear Terminal',   category:'Terminal', action: clearLines },
    { id:'sb',      label:'Toggle Sidebar',   category:'View',     action: () => store.toggleSidebar() },
  ], [termOpen, running]);

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ background: theme.bg }}>
      <TopBar onRun={run} onStop={stop} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — desktop */}
        {sidebarOpen && (
          <div className="relative hidden shrink-0 md:block" style={{ width: sidebarW }}>
            <Sidebar />
            <div
              onMouseDown={drag(setSidebarW, 'x', sidebarW)}
              className="absolute right-0 top-0 h-full w-1 cursor-ew-resize hover:bg-cv-accent/60 transition-colors"
            />
          </div>
        )}

        {/* Sidebar — mobile overlay */}
        {mobileNav && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileNav(false)} />
            <div className="absolute left-0 top-0 h-full w-64 shadow-2xl"><Sidebar /></div>
          </div>
        )}

        <div className="flex flex-1 flex-col overflow-hidden">
          <Tabs />

          {/* Editor */}
          <div className={`flex-1 overflow-hidden ${mobileView === 'term' ? 'hidden md:block' : ''}`}>
            <CodeEditor />
          </div>

          {/* Terminal */}
          {termOpen && (
            <>
              <div
                onMouseDown={drag(setTermH, 'y', termH, true)}
                className="hidden h-1 shrink-0 cursor-ns-resize border-t border-cv-border hover:bg-cv-accent/50 md:block transition-colors"
              />
              <div
                className={`shrink-0 border-t border-cv-border ${mobileView === 'editor' ? 'hidden md:block' : 'flex-1'}`}
                style={mobileView === 'editor' ? { height: termH } : undefined}>
                <Terminal />
              </div>
            </>
          )}
        </div>
      </div>

      <StatusBar />

      {/* Mobile bottom nav */}
      <div className="flex shrink-0 items-center justify-around border-t border-cv-border bg-cv-surface px-4 py-2 md:hidden">
        <button onClick={() => setMobileNav(true)} className="ib flex-col gap-0.5 !p-2">
          <Folder size={17} /><span className="text-[8px]">Files</span>
        </button>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={running ? stop : run}
          className="flex h-11 w-11 items-center justify-center rounded-full text-white shadow-lg"
          style={{ background: running ? 'var(--cv-error)' : 'var(--cv-success)' }}>
          {running
            ? <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}
                className="h-3.5 w-3.5 rounded bg-white" />
            : <Play size={16} fill="white" />}
        </motion.button>
        <button
          onClick={() => { setMobileView(mobileView === 'editor' ? 'term' : 'editor'); setTermOpen(true); }}
          className="ib flex-col gap-0.5 !p-2">
          <TermIcon size={17} /><span className="text-[8px]">Terminal</span>
        </button>
        <button onClick={() => setShowCfg(true)} className="ib flex-col gap-0.5 !p-2">
          <Settings size={17} /><span className="text-[8px]">Settings</span>
        </button>
      </div>

      <div className="pointer-events-none fixed bottom-8 right-4 z-40 hidden select-none md:block">
        <span className="text-[11px]" style={{ color: theme.muted, opacity: 0.4 }}>Created by Shiyam</span>
      </div>

      <Notifications />
      <CommandPalette cmds={cmds} />
      <SettingsModal />
      <ExportModal />
      <SnippetsPanel />
      <HistoryPanel />
    </div>
  );
}
