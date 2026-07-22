import { useIDEStore } from '../store/ideStore';
import { exportFile, exportProject } from '../services/export';
import { X, Download, Upload, FileText, Archive, Image, Printer } from 'lucide-react';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function ExportPanel() {
  const { showExport, setExportOpen, files, settings, getActiveFile, notify, importFiles } = useIDEStore();
  const [lineNums, setLineNums] = useState(true);
  const [paperSize, setPaperSize] = useState<'a4' | 'letter' | 'legal'>('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const fileRef = useRef<HTMLInputElement>(null);
  const file = getActiveFile();

  if (!showExport) return null;

  const doExport = (fmt: string) => {
    if (!file) { notify({ type: 'warning' as const, title: 'No file selected' }); return; }
    exportFile(file, fmt as any, { includeLineNumbers: lineNums, theme: settings.theme, paperSize, orientation });
    notify({ type: 'success' as const, title: `Exported as .${fmt}` });
  };

  const doZip = () => {
    exportProject(files.filter(f => f.type === 'file') as any);
    notify({ type: 'success' as const, title: 'Exported project as ZIP' });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fs = Array.from(e.target.files ?? []) as File[];
    if (!fs.length) return;
    for (const f of fs) {
      if (f.name.endsWith('.zip')) {
        const { importZip } = await import('../services/export');
        const entries = await importZip(f);
        importFiles(entries);
      } else {
        const text = await f.text();
        importFiles([{ name: f.name, content: text }]);
      }
    }
    e.target.value = '';
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={() => setExportOpen(false)}>
        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
          className="w-[700px] max-w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl border border-cv-border bg-cv-surface shadow-2xl"
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-cv-border px-5 py-3">
            <h2 className="text-sm font-semibold text-cv-text">Export & Import</h2>
            <button onClick={() => setExportOpen(false)} className="cv-icon-btn"><X size={15} /></button>
          </div>
          <div className="p-5 space-y-5">
            <div>
              <p className="mb-2 text-xs font-medium text-cv-muted">Export Current File: <span className="text-cv-text">{file?.name ?? 'none'}</span></p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {['py', 'txt', 'json', 'html', 'md', 'csv', 'xml', 'yaml', 'pdf', 'png', 'jpg', 'svg'].map(fmt => (
                  <button key={fmt} onClick={() => doExport(fmt)} disabled={!file}
                    className="flex flex-col items-center gap-1 rounded-lg border border-cv-border p-3 text-xs text-cv-text transition-all hover:border-cv-accent hover:bg-cv-accent/5 disabled:opacity-30">
                    <span className="text-base font-bold text-cv-accent">.{fmt}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-cv-border pt-4">
              <p className="mb-2 text-xs font-medium text-cv-muted">Export Options</p>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-xs text-cv-text cursor-pointer">
                  <input type="checkbox" checked={lineNums} onChange={e => setLineNums(e.target.checked)} className="accent-cv-accent" /> Line Numbers
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-cv-muted">Paper:</span>
                  <select value={paperSize} onChange={e => setPaperSize(e.target.value as any)} className="cv-input !py-0.5">
                    <option value="a4">A4</option><option value="letter">Letter</option><option value="legal">Legal</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-cv-muted">Orientation:</span>
                  <select value={orientation} onChange={e => setOrientation(e.target.value as any)} className="cv-input !py-0.5">
                    <option value="portrait">Portrait</option><option value="landscape">Landscape</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-cv-border pt-4 flex gap-2">
              <button onClick={doZip} className="flex items-center gap-2 rounded-lg bg-cv-accent px-4 py-2 text-xs font-semibold text-white hover:opacity-90">
                <Archive size={13} /> Export Project as ZIP
              </button>
              <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 rounded-lg border border-cv-border bg-cv-elevated px-4 py-2 text-xs font-medium text-cv-text hover:bg-cv-elevated/80">
                <Upload size={13} /> Import Files / ZIP
              </button>
              <input ref={fileRef} type="file" multiple accept=".py,.txt,.md,.json,.html,.css,.js,.zip" className="hidden" onChange={handleImport} />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
