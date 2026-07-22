import { useIDEStore } from '../../store/ideStore';
import { exportFile, exportProject, exportProjectAsJSON, importProjectZip, importProjectJSON, type ExportFormat } from '../../services/exportService';
import { saveVersion, getVersions, restoreVersion, saveSnapshot, getSnapshots, deleteSnapshot, generateShareLink, backupToLocalStorage } from '../../services/backupService';
import { X, Download, Upload, FileText, FileCode, FileJson, FileType, Archive, Image, Printer, History, Camera, Share2, Save, Clock, Trash2, Copy, CheckCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { printCode } from '../../services/exportService';

type Tab = 'export' | 'import' | 'print' | 'history' | 'snapshots' | 'share' | 'backup';

const TABS: { id: Tab; name: string; icon: any }[] = [
  { id: 'export', name: 'Export', icon: Download },
  { id: 'import', name: 'Import', icon: Upload },
  { id: 'print', name: 'Print', icon: Printer },
  { id: 'history', name: 'History', icon: History },
  { id: 'snapshots', name: 'Snapshots', icon: Camera },
  { id: 'share', name: 'Share', icon: Share2 },
  { id: 'backup', name: 'Backup', icon: Save },
];

const FORMATS: { id: ExportFormat; name: string; icon: any; desc: string }[] = [
  { id: 'py', name: 'Python', icon: FileCode, desc: '.py source file' },
  { id: 'txt', name: 'Text', icon: FileText, desc: 'Plain text' },
  { id: 'json', name: 'JSON', icon: FileJson, desc: 'Structured JSON' },
  { id: 'html', name: 'HTML', icon: FileCode, desc: 'Highlighted HTML' },
  { id: 'md', name: 'Markdown', icon: FileText, desc: 'Markdown with code block' },
  { id: 'csv', name: 'CSV', icon: FileType, desc: 'Comma-separated' },
  { id: 'xml', name: 'XML', icon: FileCode, desc: 'XML format' },
  { id: 'yaml', name: 'YAML', icon: FileText, desc: 'YAML format' },
  { id: 'pdf', name: 'PDF', icon: FileText, desc: 'PDF document' },
  { id: 'png', name: 'PNG', icon: Image, desc: 'PNG image' },
  { id: 'jpg', name: 'JPG', icon: Image, desc: 'JPG image' },
  { id: 'svg', name: 'SVG', icon: Image, desc: 'SVG vector' },
  { id: 'webp', name: 'WebP', icon: Image, desc: 'WebP image' },
  { id: 'zip', name: 'ZIP', icon: Archive, desc: 'ZIP archive' },
];

export function ExportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { files, activeFileId, settings, getActiveFile, notify, importFiles } = useIDEStore();
  const [tab, setTab] = useState<Tab>('export');
  const [lineNumbers, setLineNumbers] = useState(true);
  const [syntaxHighlight, setSyntaxHighlight] = useState(true);
  const [paperSize, setPaperSize] = useState<'a4' | 'letter' | 'legal'>('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [darkPdf, setDarkPdf] = useState(true);
  const [watermark, setWatermark] = useState('');
  const [header, setHeader] = useState('');
  const [footer, setFooter] = useState('');
  const [transparentBg, setTransparentBg] = useState(false);
  const [customBg, setCustomBg] = useState('');
  const [roundedCorners, setRoundedCorners] = useState(true);
  const [shadow, setShadow] = useState(true);
  const [resolution, setResolution] = useState(2);
  const [versions, setVersions] = useState<any[]>([]);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [shareReadOnly, setShareReadOnly] = useState(true);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [margin, setMargin] = useState(15);
  const [scale, setScale] = useState(100);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importType, setImportType] = useState<'zip' | 'json' | 'files'>('files');

  const file = getActiveFile();

  useEffect(() => {
    if (open && file) {
      getVersions(file.id).then(setVersions);
    }
    if (open && tab === 'snapshots') {
      getSnapshots().then(setSnapshots);
    }
  }, [open, tab, file]);

  if (!open) return null;

  const doExport = (format: ExportFormat) => {
    if (!file) { notify({ type: 'warning', title: 'No file selected' }); return; }
    exportFile(file, format, {
      includeLineNumbers: lineNumbers,
      theme: settings.theme,
      header, footer, watermark,
      paperSize, orientation,
      darkTheme: darkPdf,
      transparentBg, customBg,
      roundedCorners, shadow, resolution,
    });
    notify({ type: 'success', title: `Exported as ${format.toUpperCase()}` });
  };

  const doExportProject = () => {
    const fileFiles = files.filter(f => f.type === 'file');
    exportProject(fileFiles, 'python-studio-project.zip');
    notify({ type: 'success', title: `Exported ${fileFiles.length} files as ZIP` });
  };

  const doExportJSON = () => {
    exportProjectAsJSON(files.filter(f => f.type === 'file'), settings);
    notify({ type: 'success', title: 'Exported project as JSON' });
  };

  const doPrint = () => {
    if (!file) return;
    printCode(file, {
      includeLineNumbers: lineNumbers,
      syntaxHighlight,
      theme: settings.theme,
      paperSize,
      orientation,
      margin,
      scale,
      header, footer,
    });
    notify({ type: 'success', title: 'Print dialog opened' });
  };

  const doSaveVersion = () => {
    if (!file) return;
    saveVersion(file, `Manual save ${new Date().toLocaleTimeString()}`);
    getVersions(file.id).then(setVersions);
    notify({ type: 'success', title: 'Version saved' });
  };

  const doRestoreVersion = async (versionId: string) => {
    const v = await restoreVersion(versionId);
    if (v && file) {
      useIDEStore.getState().updateFileContent(file.id, v.content);
      notify({ type: 'success', title: 'Restored version', message: new Date(v.timestamp).toLocaleString() });
    }
  };

  const doSaveSnapshot = () => {
    saveSnapshot(`Snapshot ${new Date().toLocaleString()}`, files);
    getSnapshots().then(setSnapshots);
    notify({ type: 'success', title: 'Snapshot saved' });
  };

  const doDeleteSnapshot = (id: string) => {
    deleteSnapshot(id);
    getSnapshots().then(setSnapshots);
  };

  const doShare = () => {
    const link = generateShareLink(files.filter(f => f.type === 'file'), shareReadOnly);
    setShareLink(link);
    notify({ type: 'success', title: 'Share link generated' });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    if (importType === 'zip') {
      for (const f of files) {
        if (f.name.endsWith('.zip')) {
          const imported = await importProjectZip(f);
          importFiles(imported);
        }
      }
    } else if (importType === 'json') {
      for (const f of files) {
        if (f.name.endsWith('.json')) {
          const imported = await importProjectJSON(f);
          importFiles(imported);
        }
      }
    } else {
      for (const f of files) {
        const text = await f.text();
        importFiles([{ name: f.name, content: text }]);
      }
    }
    e.target.value = '';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          className="flex h-[640px] max-h-[90vh] w-[900px] max-w-[95vw] flex-col overflow-hidden rounded-2xl border border-cv-border bg-cv-surface shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-cv-border px-5 py-3">
            <h2 className="text-sm font-semibold text-cv-text">File Management</h2>
            <button onClick={onClose} className="cv-icon-btn"><X size={16} /></button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="w-44 shrink-0 border-r border-cv-border p-2">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors ${tab === t.id ? 'bg-cv-accent/15 text-cv-text' : 'text-cv-muted hover:bg-cv-elevated hover:text-cv-text'}`}
                >
                  <t.icon size={14} /> {t.name}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {tab === 'export' && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-cv-muted">Export Current File: {file?.name ?? 'None'}</label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                      {FORMATS.map(f => (
                        <button
                          key={f.id}
                          onClick={() => doExport(f.id)}
                          disabled={!file}
                          className="flex flex-col items-start gap-1 rounded-lg border border-cv-border p-3 text-left transition-all hover:border-cv-accent hover:bg-cv-accent/5 disabled:opacity-40"
                        >
                          <f.icon size={16} className="text-cv-accent" />
                          <span className="text-xs font-semibold text-cv-text">{f.name}</span>
                          <span className="text-[10px] text-cv-muted">{f.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-cv-border pt-4">
                    <label className="mb-2 block text-xs font-medium text-cv-muted">Export Options</label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center gap-2 text-xs text-cv-text">
                        <input type="checkbox" checked={lineNumbers} onChange={e => setLineNumbers(e.target.checked)} className="accent-cv-accent" /> Line Numbers
                      </label>
                      <label className="flex items-center gap-2 text-xs text-cv-text">
                        <input type="checkbox" checked={syntaxHighlight} onChange={e => setSyntaxHighlight(e.target.checked)} className="accent-cv-accent" /> Syntax Highlighting
                      </label>
                      <label className="flex items-center gap-2 text-xs text-cv-text">
                        <input type="checkbox" checked={darkPdf} onChange={e => setDarkPdf(e.target.checked)} className="accent-cv-accent" /> Dark Theme PDF
                      </label>
                      <label className="flex items-center gap-2 text-xs text-cv-text">
                        <input type="checkbox" checked={transparentBg} onChange={e => setTransparentBg(e.target.checked)} className="accent-cv-accent" /> Transparent BG (Image)
                      </label>
                      <label className="flex items-center gap-2 text-xs text-cv-text">
                        <input type="checkbox" checked={roundedCorners} onChange={e => setRoundedCorners(e.target.checked)} className="accent-cv-accent" /> Rounded Corners
                      </label>
                      <label className="flex items-center gap-2 text-xs text-cv-text">
                        <input type="checkbox" checked={shadow} onChange={e => setShadow(e.target.checked)} className="accent-cv-accent" /> Shadow Effects
                      </label>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-[10px] text-cv-muted">Paper Size</label>
                        <select value={paperSize} onChange={e => setPaperSize(e.target.value as any)} className="cv-input w-full">
                          <option value="a4">A4</option>
                          <option value="letter">Letter</option>
                          <option value="legal">Legal</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] text-cv-muted">Orientation</label>
                        <select value={orientation} onChange={e => setOrientation(e.target.value as any)} className="cv-input w-full">
                          <option value="portrait">Portrait</option>
                          <option value="landscape">Landscape</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] text-cv-muted">Resolution (Image)</label>
                        <select value={resolution} onChange={e => setResolution(+e.target.value)} className="cv-input w-full">
                          <option value={1}>1x (Standard)</option>
                          <option value={2}>2x (Retina)</option>
                          <option value={3}>3x (High)</option>
                          <option value={4}>4x (4K)</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] text-cv-muted">Custom Background</label>
                        <input type="color" value={customBg || '#000000'} onChange={e => setCustomBg(e.target.value)} className="h-8 w-full rounded border border-cv-border bg-transparent" />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] text-cv-muted">Header Text</label>
                        <input value={header} onChange={e => setHeader(e.target.value)} placeholder="Custom header..." className="cv-input w-full" />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] text-cv-muted">Footer Text</label>
                        <input value={footer} onChange={e => setFooter(e.target.value)} placeholder="Custom footer..." className="cv-input w-full" />
                      </div>
                      <div className="col-span-2">
                        <label className="mb-1 block text-[10px] text-cv-muted">Watermark (PDF)</label>
                        <input value={watermark} onChange={e => setWatermark(e.target.value)} placeholder="Watermark text..." className="cv-input w-full" />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-cv-border pt-4">
                    <label className="mb-2 block text-xs font-medium text-cv-muted">Export Entire Project</label>
                    <div className="flex gap-2">
                      <button onClick={doExportProject} className="flex items-center gap-1.5 rounded-lg bg-cv-accent px-4 py-2 text-xs font-semibold text-white hover:opacity-90">
                        <Archive size={14} /> Export as ZIP
                      </button>
                      <button onClick={doExportJSON} className="flex items-center gap-1.5 rounded-lg border border-cv-border bg-cv-elevated px-4 py-2 text-xs font-semibold text-cv-text hover:bg-cv-elevated/80">
                        <FileJson size={14} /> Export as JSON
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'import' && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-cv-muted">Import Type</label>
                    <div className="flex gap-2">
                      {(['files', 'zip', 'json'] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => setImportType(t)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium ${importType === t ? 'bg-cv-accent text-white' : 'border border-cv-border text-cv-muted hover:text-cv-text'}`}
                        >
                          {t === 'files' ? 'Individual Files' : t === 'zip' ? 'ZIP Archive' : 'JSON Project'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-cv-border py-12 transition-colors hover:border-cv-accent hover:bg-cv-accent/5"
                  >
                    <Upload size={32} className="mb-3 text-cv-muted" />
                    <p className="text-sm text-cv-text">Click to import files</p>
                    <p className="mt-1 text-xs text-cv-muted">
                      {importType === 'files' ? '.py, .txt, .md, .json, .html, .css, .js' : importType === 'zip' ? '.zip archive' : '.json project export'}
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple={importType === 'files'}
                    accept={importType === 'zip' ? '.zip' : importType === 'json' ? '.json' : '.py,.txt,.md,.json,.html,.css,.js'}
                    className="hidden"
                    onChange={handleImport}
                  />
                  <p className="text-xs text-cv-muted">You can also drag and drop files into the file explorer sidebar.</p>
                </div>
              )}

              {tab === 'print' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 text-xs text-cv-text">
                      <input type="checkbox" checked={lineNumbers} onChange={e => setLineNumbers(e.target.checked)} className="accent-cv-accent" /> Print with Line Numbers
                    </label>
                    <label className="flex items-center gap-2 text-xs text-cv-text">
                      <input type="checkbox" checked={syntaxHighlight} onChange={e => setSyntaxHighlight(e.target.checked)} className="accent-cv-accent" /> Syntax Highlighting
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[10px] text-cv-muted">Paper Size</label>
                      <select value={paperSize} onChange={e => setPaperSize(e.target.value as any)} className="cv-input w-full">
                        <option value="a4">A4</option>
                        <option value="letter">Letter</option>
                        <option value="legal">Legal</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] text-cv-muted">Orientation</label>
                      <select value={orientation} onChange={e => setOrientation(e.target.value as any)} className="cv-input w-full">
                        <option value="portrait">Portrait</option>
                        <option value="landscape">Landscape</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] text-cv-muted">Margin (mm)</label>
                      <input type="number" value={margin} onChange={e => setMargin(+e.target.value)} className="cv-input w-full" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] text-cv-muted">Scale (%)</label>
                      <input type="number" value={scale} onChange={e => setScale(+e.target.value)} className="cv-input w-full" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] text-cv-muted">Header</label>
                      <input value={header} onChange={e => setHeader(e.target.value)} placeholder="Header text..." className="cv-input w-full" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] text-cv-muted">Footer</label>
                      <input value={footer} onChange={e => setFooter(e.target.value)} placeholder="Footer text..." className="cv-input w-full" />
                    </div>
                  </div>
                  <button onClick={doPrint} disabled={!file} className="flex w-full items-center justify-center gap-2 rounded-lg bg-cv-accent px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40">
                    <Printer size={16} /> Open Print Preview
                  </button>
                </div>
              )}

              {tab === 'history' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-cv-muted">Version History for {file?.name ?? 'No file'}</span>
                    <button onClick={doSaveVersion} disabled={!file} className="flex items-center gap-1.5 rounded-lg bg-cv-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-40">
                      <Save size={12} /> Save Version
                    </button>
                  </div>
                  {versions.length === 0 ? (
                    <div className="py-12 text-center text-xs text-cv-muted">
                      <History size={32} className="mx-auto mb-2 opacity-40" />
                      <p>No versions saved yet</p>
                      <p className="mt-1">Click "Save Version" to create a snapshot</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {versions.map(v => (
                        <div key={v.id} className="flex items-center justify-between rounded-lg border border-cv-border p-3 hover:bg-cv-elevated/50">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-cv-muted" />
                            <div>
                              <div className="text-xs text-cv-text">{v.label ?? 'Version'}</div>
                              <div className="text-[10px] text-cv-muted">{new Date(v.timestamp).toLocaleString()}</div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => doRestoreVersion(v.id)} className="cv-icon-btn" title="Restore"><CheckCircle size={14} /></button>
                            <button onClick={() => { import('../../services/backupService').then(m => m.deleteVersion(v.id)); getVersions(file?.id ?? '').then(setVersions); }} className="cv-icon-btn hover:text-cv-error" title="Delete"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'snapshots' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-cv-muted">Project Snapshots</span>
                    <button onClick={doSaveSnapshot} className="flex items-center gap-1.5 rounded-lg bg-cv-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90">
                      <Camera size={12} /> Take Snapshot
                    </button>
                  </div>
                  {snapshots.length === 0 ? (
                    <div className="py-12 text-center text-xs text-cv-muted">
                      <Camera size={32} className="mx-auto mb-2 opacity-40" />
                      <p>No snapshots yet</p>
                      <p className="mt-1">Snapshots capture the entire project state</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {snapshots.map(s => (
                        <div key={s.id} className="flex items-center justify-between rounded-lg border border-cv-border p-3 hover:bg-cv-elevated/50">
                          <div className="flex items-center gap-2">
                            <Camera size={14} className="text-cv-accent" />
                            <div>
                              <div className="text-xs text-cv-text">{s.name}</div>
                              <div className="text-[10px] text-cv-muted">{s.files.length} files — {new Date(s.timestamp).toLocaleString()}</div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => { useIDEStore.setState({ files: s.files }); notify({ type: 'success', title: 'Snapshot restored' }); }} className="cv-icon-btn" title="Restore"><CheckCircle size={14} /></button>
                            <button onClick={() => doDeleteSnapshot(s.id)} className="cv-icon-btn hover:text-cv-error" title="Delete"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'share' && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-cv-muted">Share Mode</label>
                    <div className="flex gap-2">
                      <button onClick={() => setShareReadOnly(true)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${shareReadOnly ? 'bg-cv-accent text-white' : 'border border-cv-border text-cv-muted'}`}>Read-Only</button>
                      <button onClick={() => setShareReadOnly(false)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${!shareReadOnly ? 'bg-cv-accent text-white' : 'border border-cv-border text-cv-muted'}`}>Editable</button>
                    </div>
                  </div>
                  <button onClick={doShare} className="flex w-full items-center justify-center gap-2 rounded-lg bg-cv-accent px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
                    <Share2 size={16} /> Generate Share Link
                  </button>
                  {shareLink && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 rounded-lg border border-cv-border bg-cv-elevated p-2">
                        <input readOnly value={shareLink} className="flex-1 bg-transparent text-xs text-cv-text outline-none" />
                        <button onClick={copyLink} className="cv-icon-btn">
                          {copied ? <CheckCircle size={14} className="text-cv-success" /> : <Copy size={14} />}
                        </button>
                      </div>
                      <p className="text-[10px] text-cv-muted">The link encodes all project files. Recipients can open and view/edit the code in their browser.</p>
                    </div>
                  )}
                </div>
              )}

              {tab === 'backup' && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-cv-border p-4">
                    <h3 className="mb-2 text-sm font-semibold text-cv-text">Backup to Local Storage</h3>
                    <p className="mb-3 text-xs text-cv-muted">Save a copy of all files to browser localStorage for quick recovery.</p>
                    <button onClick={() => { backupToLocalStorage(files); notify({ type: 'success', title: 'Backup saved to localStorage' }); }} className="flex items-center gap-1.5 rounded-lg bg-cv-accent px-4 py-2 text-xs font-semibold text-white hover:opacity-90">
                      <Save size={14} /> Backup Now
                    </button>
                  </div>
                  <div className="rounded-lg border border-cv-border p-4">
                    <h3 className="mb-2 text-sm font-semibold text-cv-text">Auto-Recovery</h3>
                    <p className="text-xs text-cv-muted">Auto-recovery is enabled. Your unsaved changes are periodically saved to IndexedDB. If the browser crashes, you'll be prompted to restore on next load.</p>
                  </div>
                  <div className="rounded-lg border border-cv-border p-4">
                    <h3 className="mb-2 text-sm font-semibold text-cv-text">Cloud Storage (Coming Soon)</h3>
                    <p className="text-xs text-cv-muted">Architecture is prepared for Google Drive, OneDrive, Dropbox, GitHub, and GitLab integration.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
